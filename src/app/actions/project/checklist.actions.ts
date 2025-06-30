'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { ChecklistTemplateFormValues } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

export async function manageChecklistTemplate(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  userId: string,
  payload: { templateId?: string; data?: ChecklistTemplateFormValues }
): Promise<{ success: boolean; error?: string }> {
  if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_CHECKLISTS)) {
    return { success: false, error: "U heeft geen permissie om checklists te beheren." };
  }

  try {
    const { templateId, data } = payload;
    if (action === 'create' && data) {
      await addDoc(collection(db, 'checklistTemplates'), {
        ...data,
        organizationId,
        creatorId: userId,
        createdAt: new Date(),
      });
    } else if (action === 'update' && templateId && data) {
      const templateRef = doc(db, 'checklistTemplates', templateId);
      await updateDoc(templateRef, data as any);
    } else if (action === 'delete' && templateId) {
      const templateRef = doc(db, 'checklistTemplates', templateId);
      await deleteDoc(templateRef);
    } else {
      throw new Error('Ongeldige actie of payload.');
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
