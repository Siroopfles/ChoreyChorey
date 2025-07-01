
'use server';

import { db } from '@/lib/core/firebase';
import { doc, getDoc, updateDoc, writeBatch, arrayUnion, deleteField } from 'firebase/firestore';
import type { Subtask, Task } from '@/lib/types';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import { addHistoryEntry } from '@/lib/utils/history-utils';

export async function reorderTasksAction(tasksToUpdate: {id: string, order: number}[]): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const batch = writeBatch(db);
        tasksToUpdate.forEach(taskUpdate => {
            const taskRef = doc(db, 'tasks', taskUpdate.id);
            batch.update(taskRef, { order: taskUpdate.order });
        });
        await batch.commit();
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function toggleSubtaskCompletionAction(taskId: string, subtaskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");

        const taskToUpdate = taskDoc.data() as Task;
        const subtaskText = taskToUpdate.subtasks.find(s => s.id === subtaskId)?.text;
        const isCompleted = !taskToUpdate.subtasks.find(s => s.id === subtaskId)?.completed;

        const updatedSubtasks = taskToUpdate.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        
        const historyEntry = addHistoryEntry(userId, 'Subtaak bijgewerkt', `"${subtaskText}" gemarkeerd als ${isCompleted ? 'voltooid' : 'open'}`);
        await updateDoc(taskRef, { subtasks: updatedSubtasks, history: arrayUnion(historyEntry) });
        
        const updatedTask = { ...taskToUpdate, subtasks: updatedSubtasks, id: taskId };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function resetSubtasksAction(taskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean, taskTitle: string } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");

        const taskToUpdate = taskDoc.data() as Task;
        if (!taskToUpdate.subtasks || taskToUpdate.subtasks.length === 0) {
            return { data: null, error: 'Geen subtaken om te resetten.' };
        }

        const resetSubtasks: Subtask[] = taskToUpdate.subtasks.map(subtask => ({ ...subtask, completed: false }));
        
        const historyEntry = addHistoryEntry(userId, 'Alle subtaken gereset');
        await updateDoc(taskRef, { subtasks: resetSubtasks, history: arrayUnion(historyEntry) });
        
        const updatedTask = { ...taskToUpdate, subtasks: resetSubtasks, id: taskId };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        return { data: { success: true, taskTitle: taskToUpdate.title }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function promoteSubtaskToTask(parentTaskId: string, subtask: Subtask, userId: string): Promise<{ data: { success: boolean; newTaskId: string; newTastTitle: string; } | null; error: string | null; }> {
    try {
        const batch = writeBatch(db);
        const parentTaskRef = doc(db, 'tasks', parentTaskId);
        const parentTaskDoc = await getDoc(parentTaskRef);

        if (!parentTaskDoc.exists()) {
            throw new Error("Oudertaak niet gevonden.");
        }
        const parentTask = parentTaskDoc.data() as Task;

        // 1. Create the new task from the subtask
        const newTaskRef = doc(collection(db, 'tasks'));
        const newTaskData: Omit<Task, 'id'> = {
            title: subtask.text,
            description: `Gepromoveerd vanuit subtaak van: "${parentTask.title}"`,
            status: 'Te Doen',
            priority: parentTask.priority, // Inherit priority
            assigneeIds: parentTask.assigneeIds, // Inherit assignees
            creatorId: userId,
            organizationId: parentTask.organizationId,
            projectId: parentTask.projectId,
            teamId: parentTask.teamId,
            labels: parentTask.labels, // Inherit labels
            createdAt: new Date(),
            order: Date.now(),
            history: [addHistoryEntry(userId, 'Aangemaakt', `door promotie van subtaak uit taak #${parentTaskId}`)],
            subtasks: [],
            attachments: [],
            comments: [],
            isPrivate: subtask.isPrivate || parentTask.isPrivate,
            isSensitive: parentTask.isSensitive,
            storyPoints: undefined,
            blockedBy: [],
            isBlocked: false,
            relations: [],
            recurring: undefined,
            thanked: false,
            timeLogged: 0,
            activeTimerStartedAt: null,
            completedAt: null,
            rating: null,
            reviewerId: null,
            consultedUserIds: [],
            informedUserIds: [],
            isChoreOfTheWeek: false,
            helpNeeded: parentTask.helpNeeded ?? false,
        };
        batch.set(newTaskRef, newTaskData);

        // 2. Remove the subtask from the parent task
        const updatedSubtasks = parentTask.subtasks.filter(s => s.id !== subtask.id);
        const parentHistoryEntry = addHistoryEntry(userId, 'Subtaak gepromoveerd', `Subtaak "${subtask.text}" is omgezet naar een nieuwe taak.`);
        batch.update(parentTaskRef, {
            subtasks: updatedSubtasks,
            history: arrayUnion(parentHistoryEntry)
        });

        await batch.commit();

        await triggerWebhooks(parentTask.organizationId, 'task.created', { ...newTaskData, id: newTaskRef.id });
        await triggerWebhooks(parentTask.organizationId, 'task.updated', { ...parentTask, id: parentTask.id, subtasks: updatedSubtasks });
        
        return { data: { success: true, newTaskId: newTaskRef.id, newTastTitle: newTaskData.title }, error: null };

    } catch(e: any) {
        return { data: null, error: e.message };
    }
}

export async function updateTypingStatusAction(taskId: string, userId: string, isTyping: boolean): Promise<{ success: boolean }> {
  const taskRef = doc(db, 'tasks', taskId);
  try {
    if (isTyping) {
      await updateDoc(taskRef, {
        [`typing.${userId}`]: new Date(),
      });
    } else {
      await updateDoc(taskRef, {
        [`typing.${userId}`]: deleteField(),
      });
    }
    return { success: true };
  } catch (error) {
    // This is a non-critical background operation, so we just log the error
    // and don't bother the user with a toast.
    console.error('Error updating typing status:', error);
    return { success: false };
  }
}
