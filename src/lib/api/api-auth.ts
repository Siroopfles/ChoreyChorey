

'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';
import type { ApiPermission } from '@/lib/types';

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Authenticates an API request and returns the organization ID and permissions if successful.
 * Also updates the lastUsed timestamp on the key.
 * @param apiKey The plain text API key from the request header.
 * @returns An object with organizationId and permissions, or null if authentication fails.
 */
export async function authenticateApiKey(apiKey: string): Promise<{ organizationId: string; permissions: ApiPermission[], creatorId: string } | null> {
    if (!apiKey || !apiKey.startsWith('chorey_sk_')) {
        return null;
    }

    try {
        const hashedKey = hashKey(apiKey);
        const q = query(collection(db, 'apiKeys'), where('hashedKey', '==', hashedKey));
        const snapshot = await getDocs(q);

        if (snapshot.empty || snapshot.docs.length > 1) {
            // No key found, or somehow a duplicate hash exists.
            return null;
        }

        const keyDoc = snapshot.docs[0];
        const keyData = keyDoc.data();
        
        // "Fire and forget" update of the lastUsed timestamp.
        const keyRef = doc(db, 'apiKeys', keyDoc.id);
        updateDoc(keyRef, { lastUsed: new Date() }).catch(err => {
            console.error(`Failed to update lastUsed for key ${keyDoc.id}:`, err);
        });

        return {
            organizationId: keyData.organizationId,
            permissions: keyData.permissions || [],
            creatorId: keyData.creatorId,
        };

    } catch (error) {
        console.error("Error authenticating API key:", error);
        return null;
    }
}
