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
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) {
            return renderResponse(false, 'auth_failed_no_code');
        }

        if (!state) {
            return renderResponse(false, 'invalid_state_no_state');
        }

        const oauth2Client = getGoogleAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            return renderResponse(true, undefined, tokens.refresh_token);
        } else {
            console.error('No refresh token received from Google. Full token response:', tokens);
            return renderResponse(false, 'no_refresh_token_received');
        }

    } catch (error) {
        console.error('CRITICAL ERROR in Google OAuth Callback:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return renderResponse(false, `token_exchange_failed: ${errorMessage}`);
    }
}
