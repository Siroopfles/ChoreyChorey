
import { ConfidentialClientApplication, Configuration, LogLevel } from '@azure/msal-node';

export function getMicrosoftAuthClient() {
    const msalConfig: Configuration = {
        auth: {
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID!}`,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
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
export const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/microsoft/callback`;
