'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Session } from '@/lib/types';

export async function getUserSessions(userId: string): Promise<Session[]> {
    try {
        const sessionsQuery = query(
            collection(db, 'sessions'),
            where('userId', '==', userId),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(sessionsQuery);
        const sessions = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: (d.data().createdAt as any).toDate(),
            lastAccessed: (d.data().lastAccessed as any).toDate(),
        } as Session));
        
        return sessions.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
    } catch (error: any) {
        console.error("Error fetching user sessions:", error);
        return [];
    }
}

export async function terminateSession(sessionId: string, currentSessionId: string) {
    if (sessionId === currentSessionId) {
        return { error: 'Je kunt je huidige sessie niet op deze manier beëindigen.' };
    }
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, { isActive: false });
        return { success: true };
    } catch (error: any) {
        console.error("Error terminating session:", error);
        return { error: error.message };
    }
}

export async function terminateAllOtherSessions(userId: string, currentSessionId: string) {
    try {
        const sessionsQuery = query(
            collection(db, 'sessions'),
            where('userId', '==', userId),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(sessionsQuery);
        
        const batch = writeBatch(db);
        let count = 0;
        snapshot.forEach(sessionDoc => {
            if (sessionDoc.id !== currentSessionId) {
                batch.update(sessionDoc.ref, { isActive: false });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
        }

        return { success: true, count };

    } catch (error: any) {
        console.error("Error terminating all other sessions:", error);
        return { error: error.message };
    }
}
