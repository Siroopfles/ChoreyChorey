import { google } from 'googleapis';

export function getGoogleAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/google/callback`;

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
