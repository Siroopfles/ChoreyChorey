
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Comment, Organization, Task } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils';
import { createNotification } from './notification.actions';
import { triggerWebhooks } from '@/lib/webhook-service';
import { suggestStatusUpdate } from '@/ai/flows/suggest-status-update-flow';


export async function addCommentAction(taskId: string, text: string, userId: string, userName: string, organizationId: string) {
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
                const availableStatuses = orgData.settings?.customization?.statuses || [];
                
                const result = await suggestStatusUpdate({
                    taskId,
                    organizationId,
                    currentStatus: taskData.status,
                    availableStatuses,
                    taskTitle: taskData.title,
                    event: {
                        type: 'comment_added',
                        comment: text.replace(/<[^>]*>?/gm, ''), // send plain text
                    },
                });

                if (result.suggestion?.shouldUpdate && result.suggestion.newStatus) {
                    // For now, let's just create a notification for the creator and assignees
                    const notificationRecipients = new Set([...taskData.assigneeIds, taskData.creatorId]);
                    const notificationMessage = `AI stelt voor om de status van "${taskData.title}" te wijzigen naar "${result.suggestion.newStatus}" op basis van een recente opmerking. Reden: ${result.suggestion.reasoning}`;
                    
                    notificationRecipients.forEach(recipientId => {
                        if (recipientId) {
                            createNotification(recipientId, notificationMessage, taskId, organizationId, 'system', { eventType: 'ai_suggestion' });
                        }
                    });
                }
            }
        } catch (aiError: any) {
            console.warn("AI status suggestion failed after comment:", aiError.message);
            // Do not block the main action if AI fails
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function markCommentAsReadAction(taskId: string, commentId: string, userId: string) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) return { success: true };

        const taskData = taskDoc.data() as Task;
        const comment = taskData.comments.find(c => c.id === commentId);
        if (!comment || comment.readBy?.includes(userId)) return { success: true };

        const updatedComments = taskData.comments.map(c => 
            c.id === commentId ? { ...c, readBy: [...(c.readBy || []), userId] } : c
        );
        await updateDoc(taskRef, { comments: updatedComments });
        return { success: true };
    } catch(e: any) {
        return { error: e.message };
    }
}
