
'use server';

import { db } from '@/lib/core/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { AiFeedbackInput } from '@/ai/schemas';

export async function submitAiFeedback(feedbackData: AiFeedbackInput): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    await addDoc(collection(db, 'aiFeedback'), {
        ...feedbackData,
        createdAt: new Date(),
    });
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error("Error submitting AI feedback:", error);
    return { data: null, error: error.message };
  }
}
