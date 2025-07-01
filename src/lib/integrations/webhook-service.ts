
'use server';
import { db } from '@/lib/core/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Webhook, WebhookEvent } from '@/lib/types';
import crypto from 'crypto';

async function sendWebhook(webhook: Webhook, event: WebhookEvent, data: any) {
  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(payload)
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chorey-Signature-256': `sha256=${signature}`,
      },
      body: payload,
    });

    if (!response.ok) {
      console.error(`Webhook failed for ${webhook.name} (${webhook.id}) with status ${response.status}: ${await response.text()}`);
    } else {
       console.log(`Webhook sent successfully for ${webhook.name} (${webhook.id})`);
    }
  } catch (error) {
    console.error(`Error sending webhook for ${webhook.name} (${webhook.id}):`, error);
  }
}

export async function triggerWebhooks(organizationId: string, event: WebhookEvent, data: any) {
  try {
    const webhooksQuery = query(
      collection(db, 'webhooks'),
      where('organizationId', '==', organizationId),
      where('events', 'array-contains', event),
      where('enabled', '==', true)
    );

    const snapshot = await getDocs(webhooksQuery);
    if (snapshot.empty) {
      return;
    }

    const webhooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webhook));
    
    // Fire and forget
    for (const webhook of webhooks) {
      sendWebhook(webhook, event, data);
    }
  } catch (error) {
    console.error(`Failed to trigger webhooks for event ${event} in org ${organizationId}:`, error);
  }
}
