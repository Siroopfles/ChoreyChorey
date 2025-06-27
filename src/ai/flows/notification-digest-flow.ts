'use server';
/**
 * @fileOverview An AI agent that generates a digest of notifications.
 * - generateNotificationDigest - A function that summarizes user notifications over a period.
 */
import { ai } from '@/ai/genkit';
import { NotificationDigestInputSchema, NotificationDigestOutputSchema } from '@/ai/schemas';
import type { NotificationDigestInput, NotificationDigestOutput } from '@/ai/schemas';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';

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

    const notifications = snapshot.docs.map(doc => doc.data().message);
    
    const { text } = await ai.generate({
        model: 'gemini-pro',
        prompt: `Je bent een AI-assistent die een samenvatting maakt van meldingen. Vat de volgende lijst met meldingen samen in een beknopt, leesbaar overzicht in Markdown-formaat. Groepeer vergelijkbare meldingen.

Periode: Laatste ${days} dagen.

Meldingen:
---
- ${notifications.join('\n- ')}
---

Geef een duidelijke, nuttige samenvatting. Als er geen meldingen zijn, zeg dat dan.
`,
    });

    return text;
  }
);
