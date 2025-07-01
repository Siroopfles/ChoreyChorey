
'use server';

import { db } from '@/lib/core/firebase';
import { doc, getDoc, updateDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import type { Task } from '@/lib/types';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import { createNotification } from '@/app/actions/core/notification.actions';
import { addHistoryEntry } from '@/lib/utils/history-utils';

export async function voteOnPollAction(
  taskId: string,
  optionId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const taskRef = doc(db, 'tasks', taskId);

  try {
    await runTransaction(db, async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists()) {
        throw new Error('Taak niet gevonden');
      }
      const taskData = taskDoc.data() as Task;
      if (!taskData.poll) {
        throw new Error('Geen poll gevonden voor deze taak');
      }

      const poll = taskData.poll;
      const newOptions = poll.options.map(option => {
        let voterIds = option.voterIds || [];
        
        // If not multi-vote, remove user from any other option first.
        if (!poll.isMultiVote) {
          if (voterIds.includes(userId) && option.id !== optionId) {
            voterIds = voterIds.filter(id => id !== userId);
          }
        }
        
        // Add or remove vote for the selected option
        if (option.id === optionId) {
          const voterIndex = voterIds.indexOf(userId);
          if (voterIndex > -1) {
            // User is removing their vote
            voterIds.splice(voterIndex, 1);
          } else {
            // User is adding their vote
            voterIds.push(userId);
          }
        }
        return { ...option, voterIds };
      });

      transaction.update(taskRef, { 'poll.options': newOptions });
    });
    
    // Trigger webhook for task update
    const updatedTaskDoc = await getDoc(taskRef);
    if(updatedTaskDoc.exists()) {
        await triggerWebhooks(organizationId, 'task.updated', { id: taskId, ...updatedTaskDoc.data() });
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error voting on poll:", e);
    return { success: false, error: e.message };
  }
}


export async function handOffTaskAction(
  taskId: string,
  fromUserId: string,
  toUserId: string,
  message: string = ''
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const toUserDoc = await getDoc(doc(db, 'users', toUserId));
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists() || !fromUserDoc.exists() || !toUserDoc.exists()) {
      throw new Error("Taak of gebruiker niet gevonden.");
    }

    const taskData = taskDoc.data() as Task;
    const fromUserName = fromUserDoc.data()?.name || 'Onbekende Gebruiker';
    const toUserName = toUserDoc.data()?.name || 'Onbekende Gebruiker';

    const newAssigneeIds = Array.from(new Set([...taskData.assigneeIds.filter(id => id !== fromUserId), toUserId]));

    const historyMessage = `Van ${fromUserName} naar ${toUserName}.${message ? ` Bericht: "${message}"` : ''}`;
    const historyEntry = addHistoryEntry(fromUserId, 'Taak Overgedragen', historyMessage);
    
    await updateDoc(taskRef, {
        assigneeIds: newAssigneeIds,
        history: arrayUnion(historyEntry)
    });
    
    createNotification(
        toUserId,
        `"${taskData.title}" is aan jou overgedragen door ${fromUserName}.`,
        taskId,
        taskData.organizationId,
        fromUserId,
        { eventType: 'assignment' }
    );
    
    await triggerWebhooks(taskData.organizationId, 'task.updated', { ...taskData, id: taskId, assigneeIds: newAssigneeIds });

    return { data: { success: true }, error: null };
  } catch (e: any) {
    console.error("Error handing off task:", e);
    return { data: null, error: e.message };
  }
}
