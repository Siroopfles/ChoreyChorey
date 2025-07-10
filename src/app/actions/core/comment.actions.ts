

'use server';

import { db } from '@/lib/core/firebase';
import { doc, getDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import type { Comment, Organization, Project, Task } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import { createNotification } from './notification.actions';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import { suggestStatusUpdate } from '@/ai/flows/assistance-suggestion/suggest-status-update-flow';
import { analyzeSentiment } from '@/ai/flows/reporting-insights/analyze-sentiment-flow';
import { JIRA_BOT_USER_ID, JIRA_BOT_USER_NAME, SYSTEM_USER_ID } from '@/lib/core/constants';


async function runAiPostCommentAnalysis(taskId: string, text: string, taskData: Task, organizationId: string) {
    // These are non-critical, fire-and-forget AI analyses
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) return;
        
        const orgData = orgDoc.data() as Organization;
        const availableStatuses = (orgData.settings?.customization?.statuses || []).map(s => s.name);
        
        const [statusResult, sentimentResult] = await Promise.allSettled([
            suggestStatusUpdate({
                taskId,
                organizationId,
                currentStatus: taskData.status,
                availableStatuses: availableStatuses,
                taskTitle: taskData.title,
                event: { type: 'comment_added', comment: text },
            }),
            analyzeSentiment({ text })
        ]);

        if (statusResult.status === 'fulfilled' && statusResult.value.shouldUpdate && statusResult.value.newStatus) {
            const notificationRecipients = new Set([...taskData.assigneeIds, taskData.creatorId]);
            const notificationMessage = `AI stelt voor om de status van "${taskData.title}" te wijzigen naar "${statusResult.value.newStatus}" op basis van een recente opmerking. Reden: ${statusResult.value.reasoning}`;
            notificationRecipients.forEach(recipientId => {
                if (recipientId) {
                    createNotification(recipientId, notificationMessage, taskId, organizationId, SYSTEM_USER_ID, { eventType: 'ai_suggestion' });
                }
            });
        }
        
        if (sentimentResult.status === 'fulfilled' && sentimentResult.value.sentiment === 'Negatief') {
            const projectLeadId = taskData.projectId ? ((await getDoc(doc(db, 'projects', taskData.projectId))).data() as Project)?.ownerId : null;
            const notificationRecipients = new Set([taskData.creatorId, projectLeadId].filter(Boolean) as string[]);
            
            const notificationMessage = `Negatief sentiment gedetecteerd in een reactie op taak "${taskData.title}". AI Analyse: ${sentimentResult.value.reasoning}`;
            
            notificationRecipients.forEach(recipientId => {
                 if (recipientId && recipientId !== text) { // Don't notify the person who wrote the comment
                    createNotification(recipientId, notificationMessage, taskId, organizationId, SYSTEM_USER_ID, { eventType: 'ai_suggestion' });
                }
            });
        }

    } catch (aiError: any) {
        console.warn("AI post-comment analysis failed:", aiError.message);
    }
}


export async function addCommentAction(
  taskId: string,
  text: string,
  userId: string,
  userName: string,
  organizationId: string,
  parentId: string | null = null
): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");
        
        const taskData = taskDoc.data() as Task;
        const plainText = text.replace(/<[^>]*>?/gm, '');

        const newComment: Omit<Comment, 'id'> = {
            userId,
            text,
            createdAt: new Date(),
            readBy: [userId],
            parentId: parentId || null,
        };
        const historyEntry = addHistoryEntry(userId, parentId ? 'Gereageerd op een opmerking' : 'Reactie toegevoegd', `"${plainText}"`);
        
        await updateDoc(taskRef, {
            comments: arrayUnion({ ...newComment, id: crypto.randomUUID() }),
            history: arrayUnion(historyEntry)
        });
        
        const recipients = new Set([...taskData.assigneeIds, taskData.creatorId]);
        if (parentId) {
          const parentComment = taskData.comments.find(c => c.id === parentId);
          if (parentComment) {
            recipients.add(parentComment.userId);
          }
        }
        
        recipients.delete(userId);

        recipients.forEach(recipientId => {
          if (recipientId) {
            const message = parentId
              ? `${userName} heeft gereageerd op een opmerking in: "${taskData.title}"`
              : `${userName} heeft gereageerd op: "${taskData.title}"`;

            createNotification(
              recipientId,
              message,
              taskId,
              organizationId,
              userId,
              { eventType: 'comment', taskTitle: taskData.title }
            );
          }
        });
        
        const updatedTask = { ...taskData, id: taskId, comments: [...taskData.comments, newComment] };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        
        // Fire-and-forget AI analysis
        runAiPostCommentAnalysis(taskId, plainText, taskData, organizationId).catch(console.warn);

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
