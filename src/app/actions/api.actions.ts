
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import crypto from 'crypto';
import type { ApiKey, ApiPermission } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

export async function generateApiKey(organizationId: string, userId: string, name: string, permissions: ApiPermission[]): Promise<{ plainTextKey: string } | { error: string }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_API_KEYS)) {
        return { error: 'Geen permissie om API sleutels aan te maken.' };
    }

    try {
        const plainTextKey = `chorey_sk_${crypto.randomBytes(24).toString('hex')}`;
        const hashedKey = hashKey(plainTextKey);
        const keyPrefix = `${plainTextKey.substring(0, 12)}...`;

        const newApiKeyData: Omit<ApiKey, 'id'> = {
            name,
            organizationId,
            creatorId: userId,
            hashedKey,
            keyPrefix,
            createdAt: new Date(),
            permissions: permissions,
        };

        await addDoc(collection(db, 'apiKeys'), newApiKeyData);
        return { plainTextKey };
    } catch (e: any) {
        console.error("Error generating API key:", e);
        return { error: e.message };
    }
}

export async function getApiKeys(organizationId: string, userId: string): Promise<{ keys: Omit<ApiKey, 'hashedKey' | 'organizationId'>[] } | { error: string }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_API_KEYS)) {
        return { error: 'Geen permissie om API sleutels te bekijken.' };
    }
    
    try {
        const q = query(collection(db, 'apiKeys'), where('organizationId', '==', organizationId));
        const snapshot = await getDocs(q);
        const keys = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                creatorId: data.creatorId,
                keyPrefix: data.keyPrefix,
                createdAt: (data.createdAt as Timestamp).toDate(),
                lastUsed: (data.lastUsed as Timestamp)?.toDate(),
                permissions: data.permissions || [],
            };
        });
        return { keys };
    } catch (e: any) {
        console.error("Error fetching API keys:", e);
        return { error: e.message };
    }
}

export async function revokeApiKey(keyId: string, organizationId: string, userId: string): Promise<{ success: boolean } | { error: string }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_API_KEYS)) {
        return { error: 'Geen permissie om API sleutels in te trekken.' };
    }

    try {
        const keyRef = doc(db, 'apiKeys', keyId);
        const keyDoc = await getDoc(keyRef);

        if (!keyDoc.exists() || keyDoc.data().organizationId !== organizationId) {
            return { error: 'API sleutel niet gevonden of behoort niet tot deze organisatie.' };
        }
        
        await deleteDoc(keyRef);
        return { success: true };
    } catch (e: any) {
        console.error("Error revoking API key:", e);
        return { error: e.message };
    }
}
