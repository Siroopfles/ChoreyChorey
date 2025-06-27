import { NextResponse, type NextRequest } from 'next/server';
import { getGoogleAuthClient } from '@/lib/google-auth';

const renderResponse = (success: boolean, error?: string, refreshToken?: string | null) => {
    const message = JSON.stringify({
        type: 'google-auth-callback',
        success,
        error: error || null,
        refreshToken: refreshToken || null,
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

    try {
        const oauth2Client = getGoogleAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            return renderResponse(true, undefined, tokens.refresh_token);
        } else {
            console.error('No refresh token received from Google.');
            return renderResponse(false, 'no_refresh_token');
        }

    } catch (error) {
        console.error('Error exchanging auth code for tokens:', error);
        return renderResponse(false, 'token_exchange_failed');
    }
}
