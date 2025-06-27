
import { NextResponse, type NextRequest } from 'next/server';
import { getMicrosoftAuthClient, scopes, redirectUri } from '@/lib/microsoft-graph-auth';

// This is the same HTML response helper as the Google one.
const renderResponse = (success: boolean, error?: string, refreshToken?: string | null) => {
    const message = JSON.stringify({
        type: 'microsoft-auth-callback', // Different type to distinguish from Google
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
        const state = url.searchParams.get('state'); // The userId is passed in the state

        if (!code || !state) {
            return renderResponse(false, 'auth_failed_no_code_or_state');
        }

        const msalClient = getMicrosoftAuthClient();
        const tokenRequest = {
            code,
            scopes,
            redirectUri,
        };

        const response = await msalClient.acquireTokenByCode(tokenRequest);

        if (response && response.refreshToken) {
            return renderResponse(true, undefined, response.refreshToken);
        } else {
            console.error('No refresh token received from Microsoft. Full token response:', response);
            return renderResponse(false, 'no_refresh_token_received');
        }

    } catch (error) {
        console.error('CRITICAL ERROR in Microsoft OAuth Callback:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return renderResponse(false, `token_exchange_failed: ${errorMessage}`);
    }
}
