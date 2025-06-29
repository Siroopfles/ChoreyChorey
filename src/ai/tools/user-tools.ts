
'use server';
/**
 * @fileOverview A set of AI tools for interacting with users in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const findUserByEmail = ai.defineTool(
    {
        name: 'findUserByEmail',
        description: 'Find a user by their email address within a specific organization.',
        inputSchema: z.object({
            email: z.string().email().describe('The email address of the user to find.'),
            organizationId: z.string().describe('The ID of the organization to search within.'),
        }),
        outputSchema: z.object({
            id: z.string(),
            name: z.string(),
        }).nullable(),
    },
    async ({ email, organizationId }) => {
        const q = query(
            collection(db, 'users'),
            where('email', '==', email),
            where('organizationIds', 'array-contains', organizationId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, name: userDoc.data().name };
    }
);

export const getUsers = ai.defineTool(
    {
        name: 'getUsers',
        description: 'Get a list of users in the organization.',
        inputSchema: z.object({
            organizationId: z.string().describe('The ID of the organization.'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    },
    async ({ organizationId }) => {
        if (!organizationId || typeof organizationId !== 'string') {
            console.error('getUsers called with invalid organizationId:', organizationId);
            return [];
        }
        const q = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        return users;
    }
);
