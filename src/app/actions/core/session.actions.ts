
'use server';

import { db } from '@/lib/core/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Session } from '@/lib/types';

export async function getUserSessions(userId: string): Promise<{ data: { sessions: Session[] } | null, error: string | null }> {
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
        
        const sortedSessions = sessions.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
        return { data: { sessions: sortedSessions }, error: null };
    } catch (error: any) {
        console.error("Error fetching user sessions:", error);
        return { data: null, error: error.message };
    }
}

export async function terminateSession(sessionId: string, currentSessionId: string): Promise<{ data: { success: boolean } | null, error: string | null }> {
    if (sessionId === currentSessionId) {
        return { data: null, error: 'Je kunt je huidige sessie niet op deze manier beëindigen.' };
    }
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, { isActive: false });
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error terminating session:", error);
        return { data: null, error: error.message };
    }
}

export async function terminateAllOtherSessions(userId: string, currentSessionId: string): Promise<{ data: { success: boolean, count: number } | null, error: string | null }> {
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

        return { data: { success: true, count }, error: null };

    } catch (error: any) {
        console.error("Error terminating all other sessions:", error);
        return { data: null, error: error.message };
    }
}
