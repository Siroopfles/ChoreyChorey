
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';
import type { WebhookFormValues } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

// Action to manage webhooks
export async function manageWebhook(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  userId: string,
  payload: { webhookId?: string; data?: WebhookFormValues }
) {
  if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_WEBHOOKS)) {
    return { error: "Je hebt geen permissie om webhooks te beheren." };
  }

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
export async function regenerateWebhookSecret(webhookId: string, userId: string) {
    try {
        const webhookRef = doc(db, 'webhooks', webhookId);
        const webhookDoc = await getDoc(webhookRef);

        if (!webhookDoc.exists()) {
          return { error: 'Webhook niet gevonden.' };
        }
    
        if (!await hasPermission(userId, webhookDoc.data().organizationId, PERMISSIONS.MANAGE_WEBHOOKS)) {
            return { error: "Je hebt geen permissie om webhooks te beheren." };
        }

        const secret = crypto.randomBytes(32).toString('hex');
        await updateDoc(webhookRef, { secret });
        return { success: true, newSecret: secret };
    } catch(e: any) {
        return { error: e.message };
    }
}
