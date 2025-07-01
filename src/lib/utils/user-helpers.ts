
'use server';
import { db } from '@/lib/core/firebase';
import { doc, getDoc } from 'firebase/firestore';

type TokenName = 'togglApiToken' | 'clockifyApiToken';

/**
 * Retrieves a specific API token from a user's profile.
 * @param userId The ID of the user.
 * @param tokenName The name of the token field to retrieve.
 * @returns A promise that resolves to the API token string or null.
 */
export async function getApiToken(userId: string, tokenName: TokenName): Promise<string | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data()[tokenName] || null : null;
}
