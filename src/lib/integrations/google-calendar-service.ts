'use server';

import { google } from 'googleapis';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getGoogleAuthClient } from '@/lib/google-auth';
import type { Task, User } from '@/lib/types';
import { format, addHours } from 'date-fns';

async function getAuthenticatedClient(userId: string) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        console.error('Google Calendar: User not found for ID:', userId);
        return null;
    }

    const userData = userDoc.data() as User;
    const refreshToken = userData.googleRefreshToken;

    if (!refreshToken) {
        return null; // User has not connected their calendar
    }
    
    const client = getGoogleAuthClient();
    client.setCredentials({ refresh_token: refreshToken });
    
    // Check if the access token is expired and refresh it if necessary
    const expiryDate = client.credentials.expiry_date || 0;
    if (Date.now() >= expiryDate) {
        try {
            const { credentials } = await client.refreshAccessToken();
            client.setCredentials(credentials);
        } catch (error) {
            console.error('Failed to refresh Google access token for user:', userId, error);
            // Optionally, clear the refresh token if it's invalid
            await updateDoc(userDocRef, { googleRefreshToken: null });
            return null;
        }
    }
    
    return client;
}

const createEventFromTask = (task: Task) => {
    if (!task.dueDate) return null;
    
    return {
        summary: task.title,
        description: task.description || 'Geen omschrijving.',
        start: {
            dateTime: task.dueDate.toISOString(),
            timeZone: 'Europe/Amsterdam',
        },
        end: {
            // Default to a 1-hour event duration
            dateTime: addHours(task.dueDate, 1).toISOString(),
            timeZone: 'Europe/Amsterdam',
        },
    };
}


export async function createCalendarEvent(userId: string, task: Task): Promise<string | null> {
    const client = await getAuthenticatedClient(userId);
    if (!client) return null;
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    const event = createEventFromTask(task);
    if (!event) return null;

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });
        return response.data.id || null;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return null;
    }
}

export async function updateCalendarEvent(userId: string, task: Task): Promise<string | null> {
    if (!task.googleEventId) return null;

    const client = await getAuthenticatedClient(userId);
    if (!client) return null;

    const calendar = google.calendar({ version: 'v3', auth: client });
    const event = createEventFromTask(task);
    if (!event) return null;

    try {
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: task.googleEventId,
            requestBody: event,
        });
        return response.data.id || null;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        return null;
    }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
    const client = await getAuthenticatedClient(userId);
    if (!client) return;
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
    } catch (error: any) {
        // If the event is already gone, don't throw an error.
        if (error.code === 410) {
            console.log("Google Calendar event was already deleted.");
            return;
        }
        console.error('Error deleting Google Calendar event:', error);
    }
}
