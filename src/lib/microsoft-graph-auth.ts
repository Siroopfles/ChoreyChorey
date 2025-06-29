
import { ConfidentialClientApplication, Configuration, LogLevel } from '@azure/msal-node';
import { env } from '@/lib/env';

export function getMicrosoftAuthClient() {
    const msalConfig: Configuration = {
        auth: {
            clientId: env.MICROSOFT_CLIENT_ID!,
            authority: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID!}`,
            clientSecret: env.MICROSOFT_CLIENT_SECRET!,
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message, containsPii) {
                    console.log(message);
                },
                piiLoggingEnabled: false,
                logLevel: LogLevel.Info,
            }
        }
    };

    return new ConfidentialClientApplication(msalConfig);
}

export const scopes = ['offline_access', 'User.Read', 'Calendars.ReadWrite'];
export const redirectUri = `${env.NEXT_PUBLIC_BASE_URL}/api/oauth/microsoft/callback`;
