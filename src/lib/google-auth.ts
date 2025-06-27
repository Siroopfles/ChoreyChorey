'use server';

import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/google/callback`
);

export const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
];
