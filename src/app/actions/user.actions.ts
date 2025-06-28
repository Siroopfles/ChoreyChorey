'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { GlobalUserProfile, UserStatus } from '@/lib/types';
import { authenticator } from 'otplib';
import { getGoogleAuthClient, scopes } from '@/lib/google-auth';
import { getMicrosoftAuthClient, scopes as microsoftScopes } from '@/lib/microsoft-graph-auth';

// This action now only updates the global user profile.
export async function updateUserProfile(userId: string, data: Partial<Omit<GlobalUserProfile, 'id' | 'organizationIds' | 'currentOrganizationId'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function updateUserStatus(organizationId: string, userId: string, status: UserStatus) {
    try {
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        await updateDoc(memberRef, { status });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user status:", error);
        return { error: error.message };
    }
}

export async function toggleMuteTask(organizationId: string, userId: string, taskId: string) {
    try {
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        const memberDoc = await getDoc(memberRef);
        if (!memberDoc.exists()) {
            throw new Error("Lid niet gevonden in deze organisatie.");
        }
        const memberData = memberDoc.data();
        const mutedTaskIds = memberData.mutedTaskIds || [];
        const isMuted = mutedTaskIds.includes(taskId);

        await updateDoc(memberRef, {
            mutedTaskIds: isMuted ? arrayRemove(taskId) : arrayUnion(taskId)
        });
        
        return { success: true, newState: isMuted ? 'unmuted' : 'muted' };
    } catch (error: any) {
        console.error("Error toggling task mute:", error);
        return { error: error.message };
    }
}


// --- Calendar & 2FA actions remain as they are global to the user ---

export async function generateGoogleAuthUrl(userId: string) {
    const oauth2Client = getGoogleAuthClient();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: userId,
    });
    return { url };
}

export async function disconnectGoogleCalendar(userId: string) {
    try {
        await updateUserProfile(userId, { googleRefreshToken: null });
        return { success: true };
    } catch (error: any) {
        console.error("Error disconnecting Google Calendar:", error);
        return { error: error.message };
    }
}

export async function generateMicrosoftAuthUrl(userId: string) {
    const { redirectUri } = await import('@/lib/microsoft-graph-auth');
    const msalClient = getMicrosoftAuthClient();
    try {
        const authCodeUrlParameters = {
            scopes: microsoftScopes,
            redirectUri: redirectUri,
            state: userId,
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
        await updateUserProfile(userId, { microsoftRefreshToken: null });
        return { success: true };
    } catch (error: any) {
        console.error("Error disconnecting Microsoft Calendar:", error);
        return { error: error.message };
    }
}

export async function generateTwoFactorSecret(userId: string, email: string) {
    try {
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(email, 'Chorey', secret);
        
        await updateUserProfile(userId, { twoFactorSecret: secret, twoFactorEnabled: false });

        return { otpauth };
    } catch (error: any) {
        console.error("Error generating 2FA secret:", error);
        return { error: error.message };
    }
}

export async function verifyAndEnableTwoFactor(userId: string, token: string) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
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

        await updateUserProfile(userId, {
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
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists() || !userDoc.data()?.twoFactorSecret) {
            throw new Error('2FA is niet ingeschakeld.');
        }

        const { twoFactorSecret, twoFactorRecoveryCodes } = userDoc.data() as GlobalUserProfile;
        const isTokenValid = authenticator.verify({ token, secret: twoFactorSecret! });
        const isRecoveryCode = twoFactorRecoveryCodes?.includes(token);

        if (!isTokenValid && !isRecoveryCode) {
            return { error: 'Ongeldige code.' };
        }

        await updateUserProfile(userId, {
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
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists() || !userDoc.data()?.twoFactorEnabled) {
            throw new Error("Gebruiker niet gevonden of 2FA is niet ingeschakeld.");
        }
        
        const userData = userDoc.data() as GlobalUserProfile;
        const secret = userData.twoFactorSecret;
        if (!secret) throw new Error("2FA secret is not configured.");

        const isTokenValid = authenticator.verify({ token: code, secret });
        if (isTokenValid) {
            return { success: true };
        }

        const recoveryCodes = userData.twoFactorRecoveryCodes || [];
        if (recoveryCodes.includes(code)) {
            const updatedRecoveryCodes = recoveryCodes.filter(rc => rc !== code);
            await updateUserProfile(userId, { twoFactorRecoveryCodes: updatedRecoveryCodes });
            return { success: true };
        }
        
        return { error: 'Ongeldige verificatiecode.' };

    } catch(error: any) {
        console.error("Error verifying login code:", error);
        return { error: error.message };
    }
}
