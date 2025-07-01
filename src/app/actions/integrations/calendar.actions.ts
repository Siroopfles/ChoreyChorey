'use server';

import { updateUserProfile } from '@/app/actions/user/user.actions';
import { getGoogleAuthClient, scopes as googleScopes } from '@/lib/integrations/google-auth';
import { getMicrosoftAuthClient, scopes as microsoftScopes, redirectUri } from '@/lib/integrations/microsoft-graph-auth';

// --- Google Calendar Actions ---

export async function generateGoogleAuthUrl(userId: string): Promise<{ data: { url: string } | null; error: string | null; }> {
    try {
        const oauth2Client = getGoogleAuthClient();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: googleScopes,
            prompt: 'consent',
            state: userId,
        });
        return { data: { url }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function disconnectGoogleCalendar(userId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const { error } = await updateUserProfile(userId, { googleRefreshToken: null });
        if (error) throw new Error(error);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error disconnecting Google Calendar:", error);
        return { data: null, error: error.message };
    }
}

// --- Microsoft Calendar Actions ---

export async function generateMicrosoftAuthUrl(userId: string): Promise<{ data: { url: string } | null; error: string | null; }> {
    const msalClient = getMicrosoftAuthClient();
    try {
        const authCodeUrlParameters = {
            scopes: microsoftScopes,
            redirectUri: redirectUri,
            state: userId,
        };
        const url = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
        return { data: { url }, error: null };
    } catch (error) {
        console.error("Error generating Microsoft auth URL:", error);
        return { data: null, error: (error as Error).message };
    }
}

export async function disconnectMicrosoftCalendar(userId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const { error } = await updateUserProfile(userId, { microsoftRefreshToken: null });
        if (error) throw new Error(error);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error disconnecting Microsoft Calendar:", error);
        return { data: null, error: error.message };
    }
}
