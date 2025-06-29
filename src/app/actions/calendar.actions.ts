
'use server';

import { updateUserProfile } from '@/app/actions/user.actions';
import { getGoogleAuthClient, scopes as googleScopes } from '@/lib/google-auth';
import { getMicrosoftAuthClient, scopes as microsoftScopes, redirectUri } from '@/lib/microsoft-graph-auth';

// --- Google Calendar Actions ---

export async function generateGoogleAuthUrl(userId: string) {
    const oauth2Client = getGoogleAuthClient();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: googleScopes,
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

// --- Microsoft Calendar Actions ---

export async function generateMicrosoftAuthUrl(userId: string) {
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
