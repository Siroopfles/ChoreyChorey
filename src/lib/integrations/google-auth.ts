import { google } from 'googleapis';
import { env } from '@/lib/core/env';

export function getGoogleAuthClient() {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!env.NEXT_PUBLIC_BASE_URL) {
        throw new Error("NEXT_PUBLIC_BASE_URL is not set in environment variables. This is required for Google OAuth.");
    }
    const redirectUri = `${env.NEXT_PUBLIC_BASE_URL}/api/oauth/google/callback`;

    if (!clientId || !clientSecret) {
        throw new Error("Google Client ID or Secret is not configured in environment variables. Please check your .env.local file.");
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
}

export const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
];
