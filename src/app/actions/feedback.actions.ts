
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { AiFeedbackInput } from '@/ai/schemas';

export async function submitAiFeedback(feedbackData: AiFeedbackInput) {
  try {
    await addDoc(collection(db, 'aiFeedback'), {
        ...feedbackData,
        createdAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting AI feedback:", error);
    return { error: error.message };
  }
}
