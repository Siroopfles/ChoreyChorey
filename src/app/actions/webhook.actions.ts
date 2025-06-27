
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import crypto from 'crypto';
import type { WebhookFormValues } from '@/lib/types';

// Action to manage webhooks
export async function manageWebhook(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  payload: { webhookId?: string; data?: WebhookFormValues }
) {
  try {
    if (action === 'create' && payload.data) {
      const secret = crypto.randomBytes(32).toString('hex');
      await addDoc(collection(db, 'webhooks'), {
        ...payload.data,
        organizationId,
        secret,
        createdAt: new Date(),
      });
      return { success: true };
    } else if (action === 'update' && payload.webhookId && payload.data) {
      const webhookRef = doc(db, 'webhooks', payload.webhookId);
      await updateDoc(webhookRef, payload.data);
      return { success: true };
    } else if (action === 'delete' && payload.webhookId) {
      const webhookRef = doc(db, 'webhooks', payload.webhookId);
      await deleteDoc(webhookRef);
      return { success: true };
    }
    throw new Error('Invalid action or payload.');
  } catch (error: any) {
    return { error: error.message };
  }
}

// Action to regenerate a secret
export async function regenerateWebhookSecret(webhookId: string) {
    try {
        const secret = crypto.randomBytes(32).toString('hex');
        const webhookRef = doc(db, 'webhooks', webhookId);
        await updateDoc(webhookRef, { secret });
        return { success: true, newSecret: secret };
    } catch(e: any) {
        return { error: e.message };
    }
}
