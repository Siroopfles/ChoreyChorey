import { NextResponse, type NextRequest } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { use } from 'react';

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=auth_failed', url.origin));
    }

    if (!state) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', url.origin));
    }
    
    // The state should contain the userId
    const userId = state;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                googleRefreshToken: tokens.refresh_token,
            });
            return NextResponse.redirect(new URL('/dashboard/settings?success=google_connected', url.origin));
        } else {
            console.error('No refresh token received from Google.');
            return NextResponse.redirect(new URL('/dashboard/settings?error=no_refresh_token', url.origin));
        }

    } catch (error) {
        console.error('Error exchanging auth code for tokens:', error);
        return NextResponse.redirect(new URL('/dashboard/settings?error=token_exchange_failed', url.origin));
    }
}
