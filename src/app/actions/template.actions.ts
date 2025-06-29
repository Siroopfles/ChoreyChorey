
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { TaskTemplateFormValues } from '@/lib/types';

export async function addTemplate(organizationId: string, creatorId: string, templateData: TaskTemplateFormValues): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const newTemplate = {
      ...templateData,
      organizationId,
      creatorId,
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'taskTemplates'), newTemplate);
    return { data: { success: true }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function updateTemplate(templateId: string, templateData: TaskTemplateFormValues): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const templateRef = doc(db, 'taskTemplates', templateId);
    await updateDoc(templateRef, templateData as any);
    return { data: { success: true }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function deleteTemplate(templateId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const templateRef = doc(db, 'taskTemplates', templateId);
    await deleteDoc(templateRef);
    return { data: { success: true }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}
