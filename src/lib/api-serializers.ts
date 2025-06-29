
'use server';

import { Timestamp } from 'firebase/firestore';

// Generic helper to serialize Firestore Timestamps to ISO strings for any object
export const serializeTimestamps = (data: any) => {
    if (!data) return data;
    const serializedData: any = {};
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            serializedData[key] = value.toDate().toISOString();
        } else if (value instanceof Date) {
            serializedData[key] = value.toISOString();
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively serialize nested objects, but be cautious
            // For now, let's keep it simple and not serialize deeply nested objects
            // unless we have a specific need, to avoid circular references.
            serializedData[key] = value;
        } else {
            serializedData[key] = value;
        }
    }
    return serializedData;
};

// Specific serializers for different data models can be added here if needed,
// for example, to cherry-pick fields for public responses.

export const serializeTask = (data: any) => {
    const serialized = serializeTimestamps(data);
    // You can add task-specific field selections here if needed
    delete serialized.history; // Example: Don't expose full history via API
    return serialized;
};

export const serializeProject = (data: any) => {
    return serializeTimestamps(data);
};

export const serializeTeam = (data: any) => {
    return serializeTimestamps(data);
};

export const serializeUser = (data: any) => {
    const serialized = serializeTimestamps(data);
    // Return a public-safe user object
    return {
        id: serialized.id,
        name: serialized.name,
        email: serialized.email,
        avatar: serialized.avatar,
        points: serialized.points || 0,
        skills: serialized.skills || [],
        status: serialized.status || { type: 'Offline', until: null },
    };
};
