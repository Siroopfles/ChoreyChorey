import { NextResponse, type NextRequest } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const renderResponse = (success: boolean, error?: string) => {
    const message = JSON.stringify({
        type: 'google-auth-callback',
        success,
        error: error || null,
    });

    return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Authenticating...</title>
        </head>
        <body>
            <script>
                if (window.opener) {
                    window.opener.postMessage(${message}, window.location.origin);
                }
                window.close();
            </script>
            <p>Authenticatie voltooid. U kunt dit venster sluiten.</p>
        </body>
        </html>`,
        {
            headers: {
                'Content-Type': 'text/html',
            },
        }
    );
};


export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
        return renderResponse(false, 'auth_failed');
    }

    if (!state) {
        return renderResponse(false, 'invalid_state');
    }
    
    const userId = state;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                googleRefreshToken: tokens.refresh_token,
            });
            return renderResponse(true);
        } else {
            console.error('No refresh token received from Google.');
            return renderResponse(false, 'no_refresh_token');
        }

    } catch (error) {
        console.error('Error exchanging auth code for tokens:', error);
        return renderResponse(false, 'token_exchange_failed');
    }
}
