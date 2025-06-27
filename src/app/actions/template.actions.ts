'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { TaskTemplateFormValues } from '@/lib/types';

export async function addTemplate(organizationId: string, creatorId: string, templateData: TaskTemplateFormValues) {
  try {
    const newTemplate = {
      ...templateData,
      organizationId,
      creatorId,
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'taskTemplates'), newTemplate);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateTemplate(templateId: string, templateData: TaskTemplateFormValues) {
  try {
    const templateRef = doc(db, 'taskTemplates', templateId);
    await updateDoc(templateRef, templateData as any);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    const templateRef = doc(db, 'taskTemplates', templateId);
    await deleteDoc(templateRef);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
