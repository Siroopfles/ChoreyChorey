
'use server';
    
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { generateNotificationDigest } from '@/ai/flows/notification-digest-flow';
import { createNotification } from './notification.actions';
import { markdown } from 'node-forge';

export async function sendDailyDigest(userId: string, organizationId: string) {
    try {
        const digest = await generateNotificationDigest({ userId, organizationId, period: 'daily' });
        
        // Only send if there's something to report
        if (digest && !digest.startsWith('Je hebt geen nieuwe meldingen')) {
            const message = `**Je Dagelijks Overzicht**\n\n${digest}`;
            await createNotification(userId, message, null, organizationId, 'system', { eventType: 'system' });
        }

        // Always update the timestamp, even if nothing was sent, to prevent re-triggering.
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { lastDigestSentAt: new Date() });

        return { success: true };
    } catch (e: any) {
        console.error("Error sending daily digest:", e);
        return { error: e.message };
    }
}
