
'use server';
/**
 * @fileOverview An AI agent that generates a digest of notifications.
 * - generateNotificationDigest - A function that summarizes user notifications over a period.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai, googleAI } from '@/ai/genkit';
import { NotificationDigestInputSchema, NotificationDigestOutputSchema } from '@/ai/schemas';
import type { NotificationDigestInput, NotificationDigestOutput } from '@/ai/schemas';
import { db } from '@/lib/core/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';

const promptTemplate = fs.readFileSync(path.resolve('./src/ai/prompts/notification-digest.prompt'), 'utf-8');

export async function generateNotificationDigest(input: NotificationDigestInput): Promise<NotificationDigestOutput> {
  return notificationDigestFlow(input);
}

const notificationDigestFlow = ai.defineFlow(
  {
    name: 'notificationDigestFlow',
    inputSchema: NotificationDigestInputSchema,
    outputSchema: NotificationDigestOutputSchema,
  },
  async ({ userId, organizationId, period }) => {
    const days = period === 'daily' ? 1 : 7;
    const sinceDate = subDays(new Date(), days);

    const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        where('createdAt', '>=', Timestamp.fromDate(sinceDate))
    );
    
    const snapshot = await getDocs(notificationsQuery);
    if (snapshot.empty) {
        return `Je hebt geen nieuwe meldingen ontvangen in de afgelopen ${period === 'daily' ? '24 uur' : '7 dagen'}.`;
    }

    const notificationsText = snapshot.docs.map(doc => doc.data().message).join('\n- ');
    
    const promptText = promptTemplate
      .replace('{{days}}', String(days))
      .replace('{{notifications}}', notificationsText);

    const { text } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: promptText,
    });

    return text;
  }
);
