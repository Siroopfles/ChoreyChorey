
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { AutomationFormValues } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

export async function manageAutomation(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  currentUserId: string,
  payload: {
    automationId?: string;
    data?: AutomationFormValues;
  }
) {
  // For now, let's tie this to a high-level permission.
  if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_ORGANIZATION)) {
    return { error: 'Geen permissie om automatiseringen te beheren.' };
  }

  try {
    const { automationId, data } = payload;
    if (action === 'create' && data) {
      const newAutomation = {
        ...data,
        organizationId,
        creatorId: currentUserId,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'automations'), newAutomation);
      return { success: true };
    }
    
    if (action === 'update' && automationId && data) {
      const automationRef = doc(db, 'automations', automationId);
      await updateDoc(automationRef, data as any); // cast as any to avoid deep type issues
      return { success: true };
    }

    if (action === 'delete' && automationId) {
      const automationRef = doc(db, 'automations', automationId);
      await deleteDoc(automationRef);
      return { success: true };
    }

    throw new Error('Ongeldige actie of payload voor het beheren van automatisering.');
  } catch (error: any) {
    return { error: error.message };
  }
}
