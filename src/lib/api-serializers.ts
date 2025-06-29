'use server';

import { Timestamp } from 'firebase/firestore';

// Helper to serialize Firestore Timestamps to ISO strings for JSON response
export const serializeTask = (data: any) => {
    const serializedData: any = {};
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            serializedData[key] = (data[key] as Timestamp).toDate().toISOString();
        } else if (data[key] instanceof Date) {
            serializedData[key] = data[key].toISOString();
        } else if(data[key] !== null && typeof data[key] === 'object' && !Array.isArray(data[key])) {
            // Avoid serializing complex objects like history for now
        }
        else {
            serializedData[key] = data[key];
        }
    }
    return serializedData;
};


export const serializeUser = (data: any) => {
    // Return a public-safe user object
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        points: data.points || 0,
        skills: data.skills || [],
        status: data.status || { type: 'Offline', until: null },
    };
};
