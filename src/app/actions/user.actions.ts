
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, getDoc, increment, collection, addDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import type { User, UserStatus } from '@/lib/types';
import { authenticator } from 'otplib';
import { getGoogleAuthClient, scopes } from '@/lib/google-auth';
import { getMicrosoftAuthClient, scopes as microsoftScopes, redirectUri as microsoftRedirectUri } from '@/lib/microsoft-graph-auth';

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar' | 'skills' | 'notificationSettings' | 'googleRefreshToken' | 'microsoftRefreshToken' | 'bio' | 'timezone' | 'website' | 'location' | 'togglApiToken'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function toggleSkillEndorsement(targetUserId: string, skill: string, endorserId: string) {
    if (targetUserId === endorserId) {
        return { error: 'Je kunt je eigen vaardigheden niet onderschrijven.' };
    }
    
    try {
        const targetUserRef = doc(db, 'users', targetUserId);
        
        await runTransaction(db, async (transaction) => {
            const targetUserDoc = await transaction.get(targetUserRef);
            if (!targetUserDoc.exists()) {
                throw new Error("Doelgebruiker niet gevonden.");
            }

            const targetUserData = targetUserDoc.data() as User;
            const endorsements = targetUserData.endorsements || {};
            const skillEndorsers = endorsements[skill] || [];

            const endorserUserRef = doc(db, 'users', endorserId);
            const endorserUserDoc = await transaction.get(endorserUserRef);
            if (!endorserUserDoc.exists()) {
                throw new Error("Onderschrijver niet gevonden.");
            }

            const fieldPath = `endorsements.${skill}`;
            if (skillEndorsers.includes(endorserId)) {
                // User has already endorsed, so retract endorsement
                transaction.update(targetUserRef, { [fieldPath]: arrayRemove(endorserId) });
            } else {
                // User has not endorsed, so add endorsement
                transaction.update(targetUserRef, { [fieldPath]: arrayUnion(endorserId) });
            }
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling skill endorsement:", error);
        return { error: error.message };
    }
}

export async function updateUserStatus(userId: string, status: UserStatus) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { status });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user status:", error);
        return { error: error.message };
    }
}

export async function purchaseTheme(userId: string, color: string, cost: number) {
    if (cost < 0) {
        return { error: 'Kosten kunnen niet negatief zijn.' };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("Gebruiker niet gevonden.");
            }
            
            const userData = userDoc.data() as User;

            if ((userData.points || 0) < cost) {
                throw new Error("Je hebt niet genoeg punten voor dit thema.");
            }

            transaction.update(userRef, { 
                points: increment(-cost),
                'cosmetic.primaryColor': color 
            });
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error purchasing theme:", error);
        return { error: error.message };
    }
}


// --- Google Calendar Actions ---

export async function generateGoogleAuthUrl(userId: string) {
    const oauth2Client = getGoogleAuthClient();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force to get a refresh token every time
        state: userId, // Pass userId to identify the user in the callback
    });
    return { url };
}

export async function disconnectGoogleCalendar(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            googleRefreshToken: null,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error disconnecting Google Calendar:", error);
        return { error: error.message };
    }
}

// --- Microsoft Calendar Actions ---

export async function generateMicrosoftAuthUrl(userId: string) {
    const msalClient = getMicrosoftAuthClient();
    try {
        const authCodeUrlParameters = {
            scopes: microsoftScopes,
            redirectUri: microsoftRedirectUri,
            state: userId, // Pass userId to identify the user in the callback
        };
        const url = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
        return { url };
    } catch (error) {
        console.error("Error generating Microsoft auth URL:", error);
        return { error: (error as Error).message };
    }
}

export async function disconnectMicrosoftCalendar(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            microsoftRefreshToken: null,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error disconnecting Microsoft Calendar:", error);
        return { error: error.message };
    }
}

// --- Two-Factor Authentication Actions ---

export async function generateTwoFactorSecret(userId: string, email: string) {
    try {
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(email, 'Chorey', secret);
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { twoFactorSecret: secret, twoFactorEnabled: false });

        return { otpauth };
    } catch (error: any) {
        console.error("Error generating 2FA secret:", error);
        return { error: error.message };
    }
}

export async function verifyAndEnableTwoFactor(userId: string, token: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || !userDoc.data()?.twoFactorSecret) {
            throw new Error('2FA secret not found for user.');
        }

        const secret = userDoc.data()?.twoFactorSecret;
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            return { error: 'Ongeldige code. Probeer het opnieuw.' };
        }

        const recoveryCodes = Array.from({ length: 10 }, () => 
            Math.random().toString(36).substring(2, 12).toUpperCase()
        );

        await updateDoc(userRef, {
            twoFactorEnabled: true,
            twoFactorRecoveryCodes: recoveryCodes
        });
        
        return { success: true, recoveryCodes };

    } catch (error: any) {
        console.error("Error verifying 2FA setup:", error);
        return { error: error.message };
    }
}

export async function disableTwoFactor(userId: string, token: string) {
     try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || !userDoc.data()?.twoFactorSecret) {
            throw new Error('2FA is niet ingeschakeld.');
        }

        const { twoFactorSecret, twoFactorRecoveryCodes } = userDoc.data() as User;
        const isTokenValid = authenticator.verify({ token, secret: twoFactorSecret! });
        const isRecoveryCode = twoFactorRecoveryCodes?.includes(token);

        if (!isTokenValid && !isRecoveryCode) {
            return { error: 'Ongeldige code.' };
        }

        await updateDoc(userRef, {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorRecoveryCodes: null
        });
        
        return { success: true };

    } catch (error: any) {
        console.error("Error disabling 2FA:", error);
        return { error: error.message };
    }
}


export async function verifyLoginCode(userId: string, code: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists() || !userDoc.data()?.twoFactorEnabled) {
            throw new Error("Gebruiker niet gevonden of 2FA is niet ingeschakeld.");
        }
        
        const userData = userDoc.data() as User;

        // Check TOTP
        const isTokenValid = authenticator.verify({ token: code, secret: userData.twoFactorSecret! });
        if (isTokenValid) {
            return { success: true };
        }

        // Check recovery codes
        const recoveryCodes = userData.twoFactorRecoveryCodes || [];
        if (recoveryCodes.includes(code)) {
            // Consume the recovery code
            const updatedRecoveryCodes = recoveryCodes.filter(rc => rc !== code);
            await updateDoc(userRef, { twoFactorRecoveryCodes: updatedRecoveryCodes });
            return { success: true };
        }
        
        return { error: 'Ongeldige verificatiecode.' };

    } catch(error: any) {
        console.error("Error verifying login code:", error);
        return { error: error.message };
    }
}

export async function toggleMuteTask(userId: string, taskId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("Gebruiker niet gevonden.");
        }

        const userData = userDoc.data() as User;
        const mutedTaskIds = userData.mutedTaskIds || [];

        const isMuted = mutedTaskIds.includes(taskId);

        await updateDoc(userRef, {
            mutedTaskIds: isMuted ? arrayRemove(taskId) : arrayUnion(taskId)
        });
        
        return { success: true, newState: isMuted ? 'unmuted' : 'muted' };
    } catch (error: any) {
        console.error("Error toggling task mute:", error);
        return { error: error.message };
    }
}
