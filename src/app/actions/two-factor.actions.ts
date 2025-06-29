
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { authenticator } from 'otplib';
import { updateUserProfile } from './user.actions';
import type { GlobalUserProfile } from '@/lib/types';

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
