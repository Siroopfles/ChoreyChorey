
'use server';

import 'isomorphic-fetch'; // Required for microsoft-graph-client
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { getMicrosoftAuthClient, scopes, redirectUri } from '@/lib/microsoft-graph-auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, User } from '@/lib/types';
import { addHours } from 'date-fns';
import { env } from '@/lib/env';

async function getAuthenticatedClient(userId: string) {
    if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET || !env.MICROSOFT_TENANT_ID) {
        console.warn("Microsoft Graph integration is not configured on the server. Skipping calendar event creation.");
        return null;
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        console.error('Microsoft Graph: User not found for ID:', userId);
        return null;
    }

    const userData = userDoc.data() as User;
    const refreshToken = userData.microsoftRefreshToken;
    if (!refreshToken) return null;

    const msalClient = getMicrosoftAuthClient();

    try {
        const tokenResponse = await msalClient.acquireTokenByRefreshToken({
            refreshToken,
            scopes,
        });

        if (!tokenResponse || !tokenResponse.accessToken) {
             throw new Error('Failed to acquire access token with refresh token.');
        }

        const authProvider = new TokenCredentialAuthenticationProvider(
            {
                getToken: async () => tokenResponse.accessToken,
            },
            { scopes }
        );

        return Client.initWithMiddleware({ authProvider });

    } catch (error) {
        console.error('Failed to refresh Microsoft access token for user:', userId, error);
        // Clear the refresh token if it's invalid
        await updateDoc(userDocRef, { microsoftRefreshToken: null });
        return null;
    }
}

const createEventFromTask = (task: Task) => {
    if (!task.dueDate) return null;

    return {
        subject: task.title,
        body: {
            contentType: 'HTML',
            content: task.description || 'Geen omschrijving.',
        },
        start: {
            dateTime: task.dueDate.toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: addHours(task.dueDate, 1).toISOString(),
            timeZone: 'UTC',
        },
    };
};

export async function createMicrosoftCalendarEvent(userId: string, task: Task): Promise<string | null> {
    const graphClient = await getAuthenticatedClient(userId);
    if (!graphClient) return null;

    const event = createEventFromTask(task);
    if (!event) return null;

    try {
        const response = await graphClient.api('/me/calendar/events').post(event);
        return response.id || null;
    } catch (error) {
        console.error('Error creating Microsoft Calendar event:', error);
        return null;
    }
}

export async function updateMicrosoftCalendarEvent(userId: string, task: Task): Promise<string | null> {
    if (!task.microsoftEventId) return null;

    const graphClient = await getAuthenticatedClient(userId);
    if (!graphClient) return null;

    const event = createEventFromTask(task);
    if (!event) return null;

    try {
        await graphClient.api(`/me/calendar/events/${task.microsoftEventId}`).patch(event);
        return task.microsoftEventId;
    } catch (error) {
        console.error('Error updating Microsoft Calendar event:', error);
        return null;
    }
}

export async function deleteMicrosoftCalendarEvent(userId: string, eventId: string): Promise<void> {
    const graphClient = await getAuthenticatedClient(userId);
    if (!graphClient) return;

    try {
        await graphClient.api(`/me/calendar/events/${eventId}`).delete();
    } catch (error: any) {
        if (error.statusCode === 404) {
            console.log("Microsoft Calendar event was already deleted.");
            return;
        }
        console.error('Error deleting Microsoft Calendar event:', error);
    }
}
