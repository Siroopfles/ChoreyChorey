

'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, getDocs, query, where, addDoc, getDoc, updateDoc, arrayUnion, deleteDoc, increment } from 'firebase/firestore';
import type { User, Task, TaskFormValues, Status, HistoryEntry, Recurring, Subtask, Organization } from '@/lib/types';
import { calculatePoints } from '@/lib/utils';
import { grantAchievements } from './gamification.actions';
import { createNotification } from './notification.actions';
import { triggerWebhooks } from '@/lib/webhook-service';
import Papa from 'papaparse';
import { addDays, addHours, addMonths, isBefore, startOfMonth, getDay, setDate, isAfter, addWeeks } from 'date-fns';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar-service';
import { createMicrosoftCalendarEvent, updateMicrosoftCalendarEvent, deleteMicrosoftCalendarEvent } from '@/lib/microsoft-graph-service';
import { createTogglTimeEntry } from '@/lib/toggl-service';
import { createClockifyTimeEntry } from '@/lib/clockify-service';

// --- Internal Helper Functions ---

function addHistoryEntry(userId: string | null, action: string, details?: string): HistoryEntry {
  const entry: any = {
      id: crypto.randomUUID(),
      userId: userId || 'system',
      timestamp: new Date(),
      action,
  };
  if (details) {
      entry.details = details;
  }
  return entry;
};

function calculateNextDueDate(currentDueDate: Date | undefined, recurring: Recurring): Date {
    const startDate = currentDueDate || new Date();
    // If the due date is in the past, we calculate from today to avoid creating a bunch of overdue tasks.
    const baseDate = isBefore(startDate, new Date()) ? new Date() : startDate;

    switch (recurring.frequency) {
        case 'daily':
            return addDays(baseDate, 1);
        case 'weekly':
            return addWeeks(baseDate, 1);
        case 'monthly':
            const nextMonthDate = addMonths(baseDate, 1);
            const startOfNextMonth = startOfMonth(nextMonthDate);
            
            if (recurring.monthly?.type === 'day_of_month' && recurring.monthly.day) {
                return setDate(startOfNextMonth, recurring.monthly.day);
            }
            
            if (recurring.monthly?.type === 'day_of_week' && recurring.monthly.weekday !== undefined && recurring.monthly.week) {
                const { week, weekday } = recurring.monthly;

                const allMatchingWeekdaysInMonth: Date[] = [];
                let date = startOfNextMonth;
                while(date.getMonth() === startOfNextMonth.getMonth()) {
                    if (getDay(date) === weekday) {
                        allMatchingWeekdaysInMonth.push(new Date(date.getTime()));
                    }
                    date = addDays(date, 1);
                }
                
                if (week === 'last') {
                    return allMatchingWeekdaysInMonth[allMatchingWeekdaysInMonth.length - 1] || addMonths(baseDate, 1);
                }
                
                const weekIndex = { 'first': 0, 'second': 1, 'third': 2, 'fourth': 3 }[week];
                return allMatchingWeekdaysInMonth[weekIndex] || addMonths(baseDate, 1); // Fallback
            }
            // Fallback for misconfigured monthly
            return addMonths(baseDate, 1);
        default:
            return addDays(new Date(), 1);
    }
}


// --- Exported Server Actions ---

export async function handleImportTasks(csvContent: string, mapping: Record<string, string>, organizationId: string, creatorId: string) {
    let successCount = 0;
    let errorCount = 0;

    try {
        const { data: rows } = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        
        const invertedMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
            if (value !== 'ignore') {
                acc[value] = key;
            }
            return acc;
        }, {} as Record<string, string>);

        if (!invertedMapping.title) {
            return { error: 'Het "title" veld moet gekoppeld zijn.' };
        }

        const batch = writeBatch(db);
        
        const allEmailsFromCsv = new Set<string>();
        rows.forEach((row: any) => {
            const emails = row[invertedMapping.assigneeEmail];
            if (emails) {
                emails.split(',').forEach((email: string) => allEmailsFromCsv.add(email.trim()));
            }
        });

        const allUserEmails = Array.from(allEmailsFromCsv);
        
        const usersByEmail: Record<string, User> = {};
        if (allUserEmails.length > 0) {
            const chunks = [];
            for (let i = 0; i < allUserEmails.length; i += 30) {
                chunks.push(allUserEmails.slice(i, i + 30));
            }
            
            for (const chunk of chunks) {
                 const usersQuery = query(collection(db, 'users'), where('email', 'in', chunk), where('organizationIds', 'array-contains', organizationId));
                 const usersSnapshot = await getDocs(usersQuery);
                 usersSnapshot.forEach(doc => {
                    const user = { id: doc.id, ...doc.data() } as User;
                    usersByEmail[user.email] = user;
                });
            }
        }
        
        for (const row of rows as any[]) {
            const title = row[invertedMapping.title];
            if (!title) {
                errorCount++;
                continue;
            }

            const assigneeEmails = row[invertedMapping.assigneeEmail]?.split(',').map((e: string) => e.trim()) || [];
            const assigneeIds = assigneeEmails.map((email: string) => usersByEmail[email]?.id).filter(Boolean);

            const taskData: any = {
                title,
                description: row[invertedMapping.description] || '',
                priority: row[invertedMapping.priority] || 'Midden',
                status: row[invertedMapping.status] || 'Te Doen',
                dueDate: row[invertedMapping.dueDate] ? new Date(row[invertedMapping.dueDate]) : null,
                labels: row[invertedMapping.labels] ? row[invertedMapping.labels].split(',').map((l:string) => l.trim()) : [],
                assigneeIds: assigneeIds,
                creatorId,
                organizationId,
                createdAt: new Date(),
                order: Date.now() + successCount,
                history: [{
                    id: crypto.randomUUID(),
                    userId: creatorId,
                    timestamp: new Date(),
                    action: 'Aangemaakt',
                    details: 'Via CSV import',
                }],
                subtasks: [],
                attachments: [],
                comments: [],
                isPrivate: false,
                thanked: false,
                completedAt: null,
                storyPoints: null,
                teamId: null,
                timeLogged: 0,
                activeTimerStartedAt: null,
                rating: null,
            };

            const taskRef = doc(collection(db, 'tasks'));
            batch.set(taskRef, taskData);
            successCount++;
        }

        await batch.commit();
        
        return { successCount, errorCount };

    } catch (e: any) {
        return { error: e.message, successCount, errorCount };
    }
}


export async function createTaskAction(organizationId: string, creatorId: string, creatorName: string, taskData: Partial<TaskFormValues> & { title: string }) {
    try {
        const history = [addHistoryEntry(creatorId, 'Aangemaakt')];
        const firestoreTask: Omit<Task, 'id'> = {
          title: taskData.title,
          description: taskData.description || '',
          assigneeIds: taskData.assigneeIds || [],
          creatorId: creatorId,
          projectId: taskData.projectId || null,
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 'Midden',
          isPrivate: taskData.isPrivate || false,
          isSensitive: taskData.isSensitive || false,
          labels: taskData.labels || [],
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
          attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.name || at.url, type: 'file' as const })) || [],
          comments: [],
          history: history,
          order: Date.now(),
          storyPoints: taskData.storyPoints ?? null,
          blockedBy: taskData.blockedBy || [],
          dependencyConfig: taskData.dependencyConfig || {},
          recurring: taskData.recurring ?? null,
          organizationId: organizationId,
          imageDataUri: taskData.imageDataUri ?? null,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          completedAt: null,
          rating: null,
          reviewerId: taskData.reviewerId ?? null,
          consultedUserIds: taskData.consultedUserIds || [],
          informedUserIds: taskData.informedUserIds || [],
          teamId: taskData.teamId || null,
          togglWorkspaceId: taskData.togglWorkspaceId,
          togglProjectId: taskData.togglProjectId,
          clockifyWorkspaceId: taskData.clockifyWorkspaceId,
          clockifyProjectId: taskData.clockifyProjectId,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        if (firestoreTask.assigneeIds.length > 0) {
            firestoreTask.assigneeIds.forEach(assigneeId => {
              createNotification(
                  assigneeId,
                  `${creatorName} heeft je toegewezen aan: "${firestoreTask.title}"`,
                  docRef.id,
                  organizationId,
                  creatorId,
              );
            });
        }
        if (firestoreTask.consultedUserIds.length > 0) {
            firestoreTask.consultedUserIds.forEach(userId => {
              createNotification(
                  userId,
                  `${creatorName} wil je raadplegen over: "${firestoreTask.title}"`,
                  docRef.id,
                  organizationId,
                  creatorId,
              );
            });
        }
        if (firestoreTask.informedUserIds.length > 0) {
            firestoreTask.informedUserIds.forEach(userId => {
              createNotification(
                  userId,
                  `Je bent ter informatie toegevoegd aan: "${firestoreTask.title}"`,
                  docRef.id,
                  organizationId,
                  creatorId,
              );
            });
        }

        await triggerWebhooks(organizationId, 'task.created', { ...firestoreTask, id: docRef.id });

        if (taskData.dueDate) {
            // Google Calendar Sync
            try {
                const eventId = await createCalendarEvent(creatorId, { ...firestoreTask, id: docRef.id });
                if (eventId) {
                    await updateDoc(docRef, { googleEventId: eventId });
                }
            } catch (e) {
                console.error("Google Calendar event creation failed:", e);
            }
             // Microsoft Calendar Sync
            try {
                const eventId = await createMicrosoftCalendarEvent(creatorId, { ...firestoreTask, id: docRef.id });
                if (eventId) {
                    await updateDoc(docRef, { microsoftEventId: eventId });
                }
            } catch (e) {
                console.error("Microsoft Calendar event creation failed:", e);
            }
        }
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateTaskAction(taskId: string, updates: Partial<Task>, userId: string, organizationId: string) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) {
            throw new Error("Taak niet gevonden.");
        }
        const taskToUpdate = taskDoc.data() as Task;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userName = userDoc.exists() ? userDoc.data().name : 'Onbekend';

        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
          throw new Error("Organisatie niet gevonden.");
        }
        const organization = orgDoc.data() as Organization;
        const showGamification = organization.settings?.features?.gamification !== false;

        const finalUpdates: { [key: string]: any } = { ...updates };
        const newHistory: HistoryEntry[] = [];

        const fieldsToTrack: (keyof Task)[] = ['status', 'priority', 'dueDate', 'title', 'projectId', 'reviewerId'];
        fieldsToTrack.forEach(field => {
            if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(taskToUpdate[field])) {
                let oldValue = field === 'dueDate' ? (taskToUpdate[field] ? (taskToUpdate[field] as Date).toLocaleDateString() : 'geen') : (taskToUpdate[field] || 'leeg');
                let newValue = field === 'dueDate' ? (updates[field] ? (updates[field] as Date).toLocaleDateString() : 'geen') : (updates[field] || 'leeg');
                let details = `van "${oldValue}" naar "${newValue}"`;
                newHistory.push(addHistoryEntry(userId, `Veld '${field}' gewijzigd`, details));
            }
        });

        if (updates.assigneeIds) {
             const addedAssignees = updates.assigneeIds.filter(id => !taskToUpdate.assigneeIds.includes(id));
             addedAssignees.forEach(assigneeId => {
                 createNotification(assigneeId, `Je bent toegewezen aan taak: "${taskToUpdate.title}"`, taskId, organizationId, userId);
             });
             newHistory.push(addHistoryEntry(userId, `Toegewezenen gewijzigd`));
        }

        if (updates.consultedUserIds) {
             const added = updates.consultedUserIds.filter(id => !(taskToUpdate.consultedUserIds || []).includes(id));
             added.forEach(id => {
                 createNotification(id, `Je wordt geraadpleegd over taak: "${taskToUpdate.title}"`, taskId, organizationId, userId);
             });
             newHistory.push(addHistoryEntry(userId, `Geraadpleegden gewijzigd`));
        }

        if (updates.informedUserIds) {
             const added = updates.informedUserIds.filter(id => !(taskToUpdate.informedUserIds || []).includes(id));
             added.forEach(id => {
                 createNotification(id, `Je wordt geïnformeerd over taak: "${taskToUpdate.title}"`, taskId, organizationId, userId);
             });
             newHistory.push(addHistoryEntry(userId, `Geïnformeerden gewijzigd`));
        }
        
        if (updates.reviewerId && updates.reviewerId !== taskToUpdate.reviewerId) {
            createNotification(updates.reviewerId, `Je bent gevraagd om een review te doen voor: "${taskToUpdate.title}"`, taskId, organizationId, userId);
        }

        if (updates.status === 'In Review' && taskToUpdate.creatorId && taskToUpdate.creatorId !== userId) {
             createNotification(taskToUpdate.creatorId, `${userName} heeft de taak "${taskToUpdate.title}" ter review aangeboden.`, taskId, organizationId, userId);
        }

        if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
            finalUpdates.completedAt = new Date();
            if(showGamification && taskToUpdate.assigneeIds.length > 0) {
                const points = calculatePoints(taskToUpdate.priority, taskToUpdate.storyPoints);
                const batch = writeBatch(db);
                taskToUpdate.assigneeIds.forEach(async (assigneeId) => {
                    const userPointsRef = doc(db, 'users', assigneeId);
                    batch.update(userPointsRef, { points: increment(points) });
                    await grantAchievements(assigneeId, 'completed', { ...taskToUpdate, status: 'Voltooid' });
                });
                await batch.commit();
            }

            if (taskToUpdate.recurring) {
                const nextDueDate = calculateNextDueDate(taskToUpdate.dueDate, taskToUpdate.recurring);
                const newTaskData = {
                    ...taskToUpdate,
                    recurring: taskToUpdate.recurring,
                    status: 'Te Doen' as Status,
                    dueDate: nextDueDate,
                    createdAt: new Date(),
                    subtasks: taskToUpdate.subtasks.map(s => ({...s, completed: false })),
                    comments: [],
                    history: [addHistoryEntry(userId, 'Automatisch aangemaakt', `Herhaling van taak ${taskToUpdate.id}`)],
                    order: Date.now(),
                    thanked: false,
                };
                delete (newTaskData as any).id;
                delete (newTaskData as any).completedAt;

                const docRef = await addDoc(collection(db, 'tasks'), newTaskData);
                if (newTaskData.assigneeIds.length > 0) {
                    newTaskData.assigneeIds.forEach(assigneeId => {
                        createNotification(assigneeId, `Nieuwe herhalende taak: "${newTaskData.title}"`, docRef.id, organizationId, userId);
                    })
                }
                await triggerWebhooks(organizationId, 'task.created', { ...newTaskData, id: docRef.id });
            }
        }
        
        if (newHistory.length > 0) finalUpdates.history = arrayUnion(...newHistory);
        if (updates.status && updates.status !== taskToUpdate.status) finalUpdates.order = Date.now();
        
        Object.keys(finalUpdates).forEach(key => { if ((finalUpdates as any)[key] === undefined) { (finalUpdates as any)[key] = null; }});
        
        await updateDoc(taskRef, finalUpdates);
        const updatedTask = { ...taskToUpdate, ...finalUpdates, id: taskId };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);

        const dueDateChanged = 'dueDate' in updates;

        // Google Calendar Sync
        try {
            if (dueDateChanged) {
                if (updates.dueDate && updatedTask.googleEventId) { // Date changed, event exists -> update
                    await updateCalendarEvent(userId, updatedTask);
                } else if (updates.dueDate && !updatedTask.googleEventId) { // Date added, no event -> create
                    const eventId = await createCalendarEvent(userId, updatedTask);
                    if (eventId) await updateDoc(taskRef, { googleEventId: eventId });
                } else if (!updates.dueDate && updatedTask.googleEventId) { // Date removed, event exists -> delete
                    await deleteCalendarEvent(userId, updatedTask.googleEventId);
                    await updateDoc(taskRef, { googleEventId: null });
                }
            } else if (('title' in updates || 'description' in updates) && updatedTask.googleEventId) {
                await updateCalendarEvent(userId, updatedTask);
            }
        } catch (e) {
            console.error("Google Calendar event update failed:", e);
        }

         // Microsoft Calendar Sync
        try {
            if (dueDateChanged) {
                if (updates.dueDate && updatedTask.microsoftEventId) { // Date changed, event exists -> update
                    await updateMicrosoftCalendarEvent(userId, updatedTask);
                } else if (updates.dueDate && !updatedTask.microsoftEventId) { // Date added, no event -> create
                    const eventId = await createMicrosoftCalendarEvent(userId, updatedTask);
                    if (eventId) await updateDoc(taskRef, { microsoftEventId: eventId });
                } else if (!updates.dueDate && updatedTask.microsoftEventId) { // Date removed, event exists -> delete
                    await deleteMicrosoftCalendarEvent(userId, updatedTask.microsoftEventId);
                    await updateDoc(taskRef, { microsoftEventId: null });
                }
            } else if (('title' in updates || 'description' in updates) && updatedTask.microsoftEventId) {
                await updateMicrosoftCalendarEvent(userId, updatedTask);
            }
        } catch (e) {
            console.error("Microsoft Calendar event update failed:", e);
        }
        
        return { success: true, updatedTask };

    } catch (e: any) {
        return { error: e.message };
    }
}

export async function cloneTaskAction(taskId: string, userId: string, organizationId: string) {
    try {
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");

        const taskToClone = taskDoc.data();
        const clonedTask = {
          ...taskToClone,
          title: `[KLONE] ${taskToClone.title}`,
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          creatorId: userId,
          completedAt: null,
          comments: [],
          history: [addHistoryEntry(userId, 'Gekloond', `van taak ${taskId}`)],
          order: Date.now(),
          organizationId,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          rating: null,
          dependencyConfig: taskToClone.dependencyConfig || {},
          consultedUserIds: taskToClone.consultedUserIds || [],
          informedUserIds: taskToClone.informedUserIds || [],
          googleEventId: null, // Don't clone the calendar event
          microsoftEventId: null,
          clockifyWorkspaceId: taskToClone.clockifyWorkspaceId,
          clockifyProjectId: taskToClone.clockifyProjectId,
        };
        
        delete (clonedTask as any).id; 
        const docRef = await addDoc(collection(db, 'tasks'), clonedTask);
        await triggerWebhooks(organizationId, 'task.created', { ...clonedTask, id: docRef.id });
        return { success: true, clonedTaskTitle: clonedTask.title };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function splitTaskAction(taskId: string, userId: string, organizationId: string) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) { throw new Error("Taak niet gevonden."); }

        const originalTask = taskDoc.data();
        if (!originalTask.subtasks || originalTask.subtasks.length < 2) {
            return { error: 'Een taak moet minimaal 2 subtaken hebben om te kunnen splitsen.' };
        }

        const splitIndex = Math.ceil(originalTask.subtasks.length / 2);
        const originalSubtasks = originalTask.subtasks.slice(0, splitIndex);
        const newSubtasks = originalTask.subtasks.slice(splitIndex);

        const newTaskData: any = {
            ...originalTask,
            title: `[SPLITSING] ${originalTask.title}`,
            subtasks: newSubtasks,
            createdAt: new Date(),
            order: (originalTask.order || Date.now()) + 1,
            history: [addHistoryEntry(userId, 'Aangemaakt door splitsing', `van taak ${taskId}`)],
            comments: [], completedAt: null, thanked: false, timeLogged: 0, activeTimerStartedAt: null, rating: null,
        };

        const batch = writeBatch(db);
        batch.update(taskRef, {
            subtasks: originalSubtasks,
            history: arrayUnion(addHistoryEntry(userId, 'Taak gesplitst', `${newSubtasks.length} subtaken verplaatst.`))
        });
        
        const newTaskRef = doc(collection(db, 'tasks'));
        batch.set(newTaskRef, newTaskData);
        await batch.commit();

        await triggerWebhooks(organizationId, 'task.created', { ...newTaskData, id: newTaskRef.id });
        await triggerWebhooks(organizationId, 'task.updated', { ...originalTask, id: taskRef.id, subtasks: originalSubtasks });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteTaskPermanentlyAction(taskId: string, organizationId: string) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if(!taskDoc.exists()) return { success: true };

        const taskData = { ...taskDoc.data(), id: taskId } as Task;
        await deleteDoc(taskRef);
        await triggerWebhooks(organizationId, 'task.deleted', taskData);
        
        // Google Calendar Sync
        if (taskData.googleEventId && taskData.creatorId) {
            try {
                await deleteCalendarEvent(taskData.creatorId, taskData.googleEventId);
            } catch (e) {
                console.error("Google Calendar event deletion failed:", e);
            }
        }

        // Microsoft Calendar Sync
        if (taskData.microsoftEventId && taskData.creatorId) {
            try {
                await deleteMicrosoftCalendarEvent(taskData.creatorId, taskData.microsoftEventId);
            } catch (e) {
                console.error("Microsoft Calendar event deletion failed:", e);
            }
        }
        
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function reorderTasksAction(tasksToUpdate: {id: string, order: number}[]) {
    try {
        const batch = writeBatch(db);
        tasksToUpdate.forEach(taskUpdate => {
            const taskRef = doc(db, 'tasks', taskUpdate.id);
            batch.update(taskRef, { order: taskUpdate.order });
        });
        await batch.commit();
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

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
            createNotification(recipientId, `${userName} heeft gereageerd op: "${taskData.title}"`, taskId, organizationId, userId);
          }
        });
        
        const updatedTask = { ...taskData, id: taskId, comments: [...taskData.comments, newComment] };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
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

export async function toggleSubtaskCompletionAction(taskId: string, subtaskId: string, userId: string, organizationId: string) {
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
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function toggleTaskTimerAction(taskId: string, userId: string, organizationId: string) {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
             throw new Error("Organisatie niet gevonden.");
        }
        const organization = orgDoc.data() as Organization;

        if (organization.settings?.features?.timeTracking === false) {
            return { error: 'Tijdregistratie is uitgeschakeld voor deze organisatie.' };
        }
        
        const taskRef = doc(db, "tasks", taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");
        const task = taskDoc.data() as Task;

        if (task.activeTimerStartedAt) {
            const startTime = (task.activeTimerStartedAt as any).toDate();
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const newTimeLogged = (task.timeLogged || 0) + elapsed;
            
            await updateDoc(taskRef, {
                timeLogged: newTimeLogged,
                activeTimerStartedAt: null,
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestopt', `Totaal gelogd: ${newTimeLogged}s`))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, timeLogged: newTimeLogged, activeTimerStartedAt: null, id: taskId});
            
            const userDoc = await getDoc(doc(db, 'users', userId));
            const user = userDoc.data() as User;

            // Toggl Integration
            if (organization.settings?.features?.toggl && user.togglApiToken && task.togglWorkspaceId && task.togglProjectId) {
                try {
                    await createTogglTimeEntry(user.togglApiToken, task.togglWorkspaceId, task, elapsed, startTime);
                } catch (togglError) {
                    console.error('Failed to sync time entry to Toggl:', togglError);
                }
            }

            // Clockify Integration
            if (organization.settings?.features?.clockify && user.clockifyApiToken && task.clockifyWorkspaceId && task.clockifyProjectId) {
                try {
                    await createClockifyTimeEntry(user.clockifyApiToken, task.clockifyWorkspaceId, task, elapsed, startTime);
                } catch (clockifyError) {
                    console.error('Failed to sync time entry to Clockify:', clockifyError);
                }
            }

        } else {
            await updateDoc(taskRef, {
                activeTimerStartedAt: new Date(),
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestart'))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, activeTimerStartedAt: new Date(), id: taskId});
        }
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function resetSubtasksAction(taskId: string, userId: string, organizationId: string) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");

        const taskToUpdate = taskDoc.data() as Task;
        if (!taskToUpdate.subtasks || taskToUpdate.subtasks.length === 0) {
            return { error: 'Geen subtaken om te resetten.' };
        }

        const resetSubtasks: Subtask[] = taskToUpdate.subtasks.map(subtask => ({ ...subtask, completed: false }));
        
        const historyEntry = addHistoryEntry(userId, 'Alle subtaken gereset');
        await updateDoc(taskRef, { subtasks: resetSubtasks, history: arrayUnion(historyEntry) });
        
        const updatedTask = { ...taskToUpdate, subtasks: resetSubtasks, id: taskId };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        return { success: true, taskTitle: taskToUpdate.title };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function setChoreOfTheWeekAction(taskId: string, organizationId: string) {
    try {
        const batch = writeBatch(db);
        
        const q = query(collection(db, 'tasks'), where('organizationId', '==', organizationId), where('isChoreOfTheWeek', '==', true));
        const currentChoresSnapshot = await getDocs(q);
        
        currentChoresSnapshot.forEach(doc => {
            batch.update(doc.ref, { isChoreOfTheWeek: false });
            triggerWebhooks(organizationId, 'task.updated', {...doc.data(), id: doc.id, isChoreOfTheWeek: false });
        });

        const newChoreRef = doc(db, 'tasks', taskId);
        batch.update(newChoreRef, { isChoreOfTheWeek: true });

        await batch.commit();

        const newChoreDoc = await getDoc(newChoreRef);
        if (newChoreDoc.exists()) {
             await triggerWebhooks(organizationId, 'task.updated', {...newChoreDoc.data(), id: newChoreDoc.id, isChoreOfTheWeek: true });
        }
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
