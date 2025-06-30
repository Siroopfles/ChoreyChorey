

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import type { Comment, Organization, Task } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils';
import { createNotification } from './notification.actions';
import { triggerWebhooks } from '@/lib/webhook-service';
import { suggestStatusUpdate } from '@/ai/flows/suggest-status-update-flow';
import { JIRA_BOT_USER_ID, JIRA_BOT_USER_NAME, SYSTEM_USER_ID } from '@/lib/constants';


export async function addCommentAction(taskId: string, text: string, userId: string, userName: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");
        
        const taskData = taskDoc.data() as Task;

        const newComment: Omit<Comment, 'id'> = { userId, text, createdAt: new Date(), readBy: [userId] };
        const historyEntry = addHistoryEntry(userId, 'Reactie toegevoegd', `"${text.replace(/<[^>]*>?/gm, '')}"`);
        
        await updateDoc(taskRef, {
            comments: arrayUnion({ ...newComment, id: crypto.randomUUID() }),
            history: arrayUnion(historyEntry)
        });
        
        const recipients = new Set([...taskData.assigneeIds, taskData.creatorId]);
        recipients.delete(userId);
        recipients.forEach(recipientId => {
          if (recipientId) {
            createNotification(
              recipientId,
              `${userName} heeft gereageerd op: "${taskData.title}"`,
              taskId,
              organizationId,
              userId,
              { eventType: 'comment', taskTitle: taskData.title }
            );
          }
        });
        
        const updatedTask = { ...taskData, id: taskId, comments: [...taskData.comments, newComment] };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        
        // After adding a comment, suggest a status update
        try {
            const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
            if (orgDoc.exists()) {
                const orgData = orgDoc.data() as Organization;
                const availableStatuses = (orgData.settings?.customization?.statuses || []).map(s => s.name);
                
                const result = await suggestStatusUpdate({
                    taskId,
                    organizationId,
                    currentStatus: taskData.status,
                    availableStatuses: availableStatuses,
                    taskTitle: taskData.title,
                    event: {
                        type: 'comment_added',
                        comment: text.replace(/<[^>]*>?/gm, ''), // send plain text
                    },
                });

                if (result.shouldUpdate && result.newStatus) {
                    // For now, let's just create a notification for the creator and assignees
                    const notificationRecipients = new Set([...taskData.assigneeIds, taskData.creatorId]);
                    const notificationMessage = `AI stelt voor om de status van "${taskData.title}" te wijzigen naar "${result.newStatus}" op basis van een recente opmerking. Reden: ${result.reasoning}`;
                    
                    notificationRecipients.forEach(recipientId => {
                        if (recipientId) {
                            createNotification(recipientId, notificationMessage, taskId, organizationId, SYSTEM_USER_ID, { eventType: 'ai_suggestion' });
                        }
                    });
                }
            }
        } catch (aiError: any) {
            console.warn("AI status suggestion failed after comment:", aiError.message);
            // Do not block the main action if AI fails
        }

        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function markCommentAsReadAction(taskId: string, commentId: string, userId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) return { data: { success: true }, error: null };

        const taskData = taskDoc.data() as Task;
        const comment = taskData.comments.find(c => c.id === commentId);
        if (!comment || comment.readBy?.includes(userId)) return { data: { success: true }, error: null };

        const updatedComments = taskData.comments.map(c => 
            c.id === commentId ? { ...c, readBy: [...(c.readBy || []), userId] } : c
        );
        await updateDoc(taskRef, { comments: updatedComments });
        return { data: { success: true }, error: null };
    } catch(e: any) {
        return { data: null, error: e.message };
    }
}


export async function toggleCommentReactionAction(taskId: string, commentId: string, emoji: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const taskRef = doc(db, 'tasks', taskId);
  try {
    await runTransaction(db, async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists()) {
        throw new Error('Taak niet gevonden');
      }

      const taskData = taskDoc.data() as Task;
      const comments = taskData.comments || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);

      if (commentIndex === -1) {
        throw new Error('Reactie niet gevonden');
      }

      const comment = comments[commentIndex];
      const reactions = comment.reactions || {};
      const userList = reactions[emoji] || [];

      if (userList.includes(userId)) {
        // User is removing their reaction
        reactions[emoji] = userList.filter(id => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        // User is adding a reaction
        reactions[emoji] = [...userList, userId];
      }

      // To update an element in an array, we must update the entire array.
      comments[commentIndex].reactions = reactions;

      transaction.update(taskRef, { comments });
    });

    return { success: true };
  } catch (e: any) {
    console.error("Error toggling comment reaction:", e);
    return { success: false, error: e.message };
  }
}
