
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { authenticator } from 'otplib';
import { updateUserProfile } from './user.actions';
import type { GlobalUserProfile } from '@/lib/types';

export async function generateTwoFactorSecret(userId: string, email: string): Promise<{ data: { otpauth: string } | null; error: string | null; }> {
    try {
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(email, 'Chorey', secret);
        
        await updateUserProfile(userId, { twoFactorSecret: secret, twoFactorEnabled: false });

        return { data: { otpauth }, error: null };
    } catch (error: any) {
        console.error("Error generating 2FA secret:", error);
        return { data: null, error: error.message };
    }
}

export async function verifyAndEnableTwoFactor(userId: string, token: string): Promise<{ data: { success: boolean; recoveryCodes: string[] } | null; error: string | null; }> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists() || !userDoc.data()?.twoFactorSecret) {
            throw new Error('2FA secret not found for user.');
        }

        const secret = userDoc.data()?.twoFactorSecret;
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            return { data: null, error: 'Ongeldige code. Probeer het opnieuw.' };
        }

        const recoveryCodes = Array.from({ length: 10 }, () => 
            Math.random().toString(36).substring(2, 12).toUpperCase()
        );

        const { error } = await updateUserProfile(userId, {
            twoFactorEnabled: true,
            twoFactorRecoveryCodes: recoveryCodes
        });
        
        if (error) throw new Error(error);
        
        return { data: { success: true, recoveryCodes }, error: null };

    } catch (error: any) {
        console.error("Error verifying 2FA setup:", error);
        return { data: null, error: error.message };
    }
}

export async function disableTwoFactor(userId: string, token: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
     try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists() || !userDoc.data()?.twoFactorSecret) {
            throw new Error('2FA is niet ingeschakeld.');
        }

        const { twoFactorSecret, twoFactorRecoveryCodes } = userDoc.data() as GlobalUserProfile;
        const isTokenValid = authenticator.verify({ token, secret: twoFactorSecret! });
        const isRecoveryCode = twoFactorRecoveryCodes?.includes(token);

        if (!isTokenValid && !isRecoveryCode) {
            return { data: null, error: 'Ongeldige code.' };
        }

        const { error } = await updateUserProfile(userId, {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorRecoveryCodes: null
        });
        
        if (error) throw new Error(error);

        return { data: { success: true }, error: null };

    } catch (error: any) {
        console.error("Error disabling 2FA:", error);
        return { data: null, error: error.message };
    }
}

export async function verifyLoginCode(userId: string, code: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
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
            return { data: { success: true }, error: null };
        }

        const recoveryCodes = userData.twoFactorRecoveryCodes || [];
        if (recoveryCodes.includes(code)) {
            const updatedRecoveryCodes = recoveryCodes.filter(rc => rc !== code);
            await updateUserProfile(userId, { twoFactorRecoveryCodes: updatedRecoveryCodes });
            return { data: { success: true }, error: null };
        }
        
        return { data: null, error: 'Ongeldige verificatiecode.' };

    } catch(error: any) {
        console.error("Error verifying login code:", error);
        return { data: null, error: error.message };
    }
}
