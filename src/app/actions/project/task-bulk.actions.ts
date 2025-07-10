'use server';

import { db } from '@/lib/core/firebase';
import { writeBatch, doc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Task } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';

type BulkTaskUpdates = Partial<Omit<Task, 'id' | 'subtasks' | 'attachments' | 'labels'>> & { 
  addLabels?: string[], 
  removeLabels?: string[] 
};

export async function bulkUpdateTasksAction(
  taskIds: string[], 
  updates: BulkTaskUpdates, 
  userId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    const batch = writeBatch(db);
    const { addLabels, removeLabels, ...otherUpdates } = updates;

    for (const taskId of taskIds) {
      const taskRef = doc(db, 'tasks', taskId);
      const updatePayload: any = { ...otherUpdates };

      if (addLabels?.length) {
        updatePayload.labels = arrayUnion(...addLabels);
      }
      if (removeLabels?.length) {
        updatePayload.labels = arrayRemove(...removeLabels);
      }
      
      // Add a generic history entry for bulk updates
      updatePayload.history = arrayUnion(addHistoryEntry(userId, 'Taak in bulk bijgewerkt', `'));

      batch.update(taskRef, updatePayload);
    }
    
    await batch.commit();
    return { success: true };
  } catch (e: any) {
    console.error("Error in bulkUpdateTasks:", e);
    return { success: false, error: e.message };
  }
}
