

'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, getDocs, query, where, addDoc, getDoc, updateDoc, arrayUnion, deleteDoc, increment, runTransaction, Timestamp, deleteField, arrayRemove } from 'firebase/firestore';
import type { User, Task, TaskFormValues, Status, Recurring, Subtask, Organization, Poll } from '@/lib/types';
import { calculatePoints, addHistoryEntry, formatTime } from '@/lib/utils';
import { grantAchievements, checkAndGrantTeamAchievements } from './gamification.actions';
import { createNotification } from './notification.actions';
import { triggerWebhooks } from '@/lib/webhook-service';
import Papa from 'papaparse';
import { addDays, addMonths, isBefore, startOfMonth, getDay, setDate, isAfter, addWeeks } from 'date-fns';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar-service';
import { createMicrosoftCalendarEvent, updateMicrosoftCalendarEvent, deleteMicrosoftCalendarEvent } from '@/lib/microsoft-graph-service';
import { createTogglTimeEntry } from '@/lib/toggl-service';
import { createClockifyTimeEntry } from '@/lib/clockify-service';

// --- Internal Helper Functions ---

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

export async function handleImportTasks(csvContent: string, mapping: Record<string, string>, organizationId: string, creatorId: string): Promise<{ data: { successCount: number; errorCount: number; } | null; error: string | null; }> {
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
            return { data: null, error: 'Het "title" veld moet gekoppeld zijn.' };
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
                history: [addHistoryEntry(creatorId, 'Aangemaakt', 'Via CSV import')],
                subtasks: [],
                attachments: [],
                comments: [],
                relations: [],
                isPrivate: false,
                isSensitive: false,
                thanked: false,
                completedAt: null,
                storyPoints: null,
                teamId: null,
                timeLogged: 0,
                activeTimerStartedAt: null,
                rating: null,
                isChoreOfTheWeek: false,
                helpNeeded: false,
            };

            const taskRef = doc(collection(db, 'tasks'));
            batch.set(taskRef, taskData);
            successCount++;
        }

        await batch.commit();
        
        return { data: { successCount, errorCount }, error: null };

    } catch (e: any) {
        return { data: null, error: e.message };
    }
}


export async function createTaskAction(organizationId: string, creatorId: string, creatorName: string, taskData: Partial<TaskFormValues> & { title: string }): Promise<{ data: { success: boolean; taskId: string; } | null; error: string | null; }> {
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
          cost: taskData.cost ?? null,
          blockedBy: taskData.blockedBy || [],
          isBlocked: false,
          relations: taskData.relations || [],
          dependencyConfig: taskData.dependencyConfig || {},
          recurring: taskData.recurring ?? null,
          organizationId: organizationId,
          imageUrl: taskData.imageUrl ?? null,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          completedAt: null,
          rating: null,
          reviewerId: taskData.reviewerId ?? null,
          consultedUserIds: taskData.consultedUserIds || [],
          informedUserIds: taskData.informedUserIds || [],
          teamId: taskData.teamId || null,
          githubLinks: taskData.githubLinks || [],
          githubLinkUrls: (taskData.githubLinks || []).map(link => link.url),
          jiraLinks: taskData.jiraLinks || [],
          jiraLinkKeys: (taskData.jiraLinks || []).map(link => link.key),
          togglWorkspaceId: taskData.togglWorkspaceId ?? null,
          togglProjectId: taskData.togglProjectId ?? null,
          clockifyWorkspaceId: taskData.clockifyWorkspaceId ?? null,
          clockifyProjectId: taskData.clockifyProjectId ?? null,
          helpNeeded: taskData.helpNeeded ?? false,
          isChoreOfTheWeek: false,
          customFieldValues: taskData.customFieldValues || {},
          poll: taskData.poll ? { ...taskData.poll, options: taskData.poll.options.map(o => ({...o, id: crypto.randomUUID()}))} : null,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        // Trigger automations for the new task
        try {
            const { processTriggers } = await import('@/lib/automation-service');
            // We need to pass the full task object including the new ID
            await processTriggers('task.created', { task: { ...firestoreTask, id: docRef.id } });
        } catch (e) {
            console.error("Error processing automations for new task:", e);
            // Do not block the main flow if automations fail
        }

        if (firestoreTask.assigneeIds.length > 0) {
            firestoreTask.assigneeIds.forEach(assigneeId => {
              createNotification(
                  assigneeId,
                  `${creatorName} heeft je toegewezen aan: "${firestoreTask.title}"`,
                  docRef.id,
                  organizationId,
                  creatorId,
                  { eventType: 'assignment' }
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
                  { eventType: 'mention' }
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
                  { eventType: 'mention' }
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
        return { data: { success: true, taskId: docRef.id }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function updateTaskAction(taskId: string, updates: Partial<Task>, userId: string, organizationId: string): Promise<{ data: { success: boolean; updatedTask: Task; } | null; error: string | null; }> {
    const taskRef = doc(db, 'tasks', taskId);
    
    try {
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden.");
        
        const taskToUpdate = { ...taskDoc.data(), id: taskDoc.id } as Task;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userName = userDoc.exists() ? userDoc.data().name : 'Onbekend';

        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const organization = orgDoc.data() as Organization;
        const showGamification = organization.settings?.features?.gamification !== false;

        const finalUpdates: { [key: string]: any } = { ...updates };
        const newHistory = [];
        const batch = writeBatch(db);
        
        if (updates.githubLinks) finalUpdates.githubLinkUrls = updates.githubLinks.map(link => link.url);
        if (updates.jiraLinks) finalUpdates.jiraLinkKeys = updates.jiraLinks.map(link => link.key);
        if (updates.poll && !taskToUpdate.poll) {
             finalUpdates.poll.options = updates.poll.options.map(o => ({...o, id: crypto.randomUUID()}));
        }

        if (updates.relations) {
            const oldRelations = taskToUpdate.relations?.map(r => `${r.type}:${r.taskId}`).sort().join(',') || '';
            const newRelations = updates.relations.map(r => `${r.type}:${r.taskId}`).sort().join(',') || '';
            if (oldRelations !== newRelations) {
                newHistory.push(addHistoryEntry(userId, `Relaties gewijzigd`));
            }
        }

        const fieldsToTrack: (keyof Task)[] = ['status', 'priority', 'dueDate', 'title', 'projectId', 'reviewerId', 'cost'];
        fieldsToTrack.forEach(field => {
            if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(taskToUpdate[field])) {
                let oldValue = field === 'dueDate' ? (taskToUpdate[field] ? (taskToUpdate[field] as Date).toLocaleDateString() : 'geen') : (taskToUpdate[field] || 'leeg');
                let newValue = field === 'dueDate' ? (updates[field] ? (updates[field] as Date).toLocaleDateString() : 'geen') : (updates[field] || 'leeg');
                newHistory.push(addHistoryEntry(userId, `Veld '${field}' gewijzigd`, `van "${oldValue}" naar "${newValue}"`));
            }
        });

        if (updates.assigneeIds) {
             const addedAssignees = updates.assigneeIds.filter(id => !taskToUpdate.assigneeIds.includes(id));
             addedAssignees.forEach(assigneeId => {
                 createNotification(assigneeId, `Je bent toegewezen aan taak: "${taskToUpdate.title}"`, taskId, organizationId, userId, { eventType: 'assignment' });
             });
             newHistory.push(addHistoryEntry(userId, `Toegewezenen gewijzigd`));
        }

        // Handle isBlocked updates based on 'blockedBy' changes
        if (updates.blockedBy) {
            const blockingTasksQuery = query(collection(db, 'tasks'), where('__name__', 'in', updates.blockedBy));
            const blockingTasksSnapshot = await getDocs(blockingTasksQuery);
            const activeBlockers = blockingTasksSnapshot.docs.some(doc => doc.data().status !== 'Voltooid');
            finalUpdates.isBlocked = activeBlockers;
        }

        if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
            finalUpdates.completedAt = new Date();
            if(showGamification && taskToUpdate.assigneeIds.length > 0) {
                 await Promise.all(taskToUpdate.assigneeIds.map(assigneeId => 
                    grantAchievements(assigneeId, organizationId, 'completed', { ...taskToUpdate, status: 'Voltooid' })
                ));
            }
            if (taskToUpdate.teamId) {
                checkAndGrantTeamAchievements(taskToUpdate.teamId, organizationId).catch(console.error);
            }
            // Deblock tasks that were blocked by this one
            const deblockedTasksQuery = query(collection(db, 'tasks'), where('blockedBy', 'array-contains', taskId));
            const deblockedSnapshot = await getDocs(deblockedTasksQuery);
            deblockedSnapshot.forEach(doc => {
                const deblockedTask = doc.data() as Task;
                const otherBlockers = deblockedTask.blockedBy?.filter(id => id !== taskId) || [];
                // This task should only be un-blocked if all its other blockers are also complete
                // A more robust solution would check all blockers' statuses. For now, we simplify.
                if (otherBlockers.length === 0) {
                    batch.update(doc.ref, { isBlocked: false });
                }
            });

            if (taskToUpdate.recurring) {
                const nextDueDate = calculateNextDueDate(taskToUpdate.dueDate, taskToUpdate.recurring);
                const newTaskData: any = { ...taskToUpdate, recurring: taskToUpdate.recurring, status: 'Te Doen' as Status, dueDate: nextDueDate, createdAt: new Date(), subtasks: taskToUpdate.subtasks.map(s => ({...s, completed: false })), comments: [], history: [addHistoryEntry(userId, 'Automatisch aangemaakt', `Herhaling van taak ${taskToUpdate.id}`)], order: Date.now(), thanked: false, };
                delete newTaskData.id;
                delete newTaskData.completedAt;
                const newDocRef = doc(collection(db, 'tasks'));
                batch.set(newDocRef, newTaskData);
                if (newTaskData.assigneeIds.length > 0) {
                    newTaskData.assigneeIds.forEach((assigneeId: string) => createNotification(assigneeId, `Nieuwe herhalende taak: "${newTaskData.title}"`, newDocRef.id, organizationId, userId, { eventType: 'assignment' }));
                }
                await triggerWebhooks(organizationId, 'task.created', { ...newTaskData, id: newDocRef.id });
            }
        }
        
        if (newHistory.length > 0) finalUpdates.history = arrayUnion(...newHistory);
        if (updates.status && updates.status !== taskToUpdate.status) finalUpdates.order = Date.now();
        
        Object.keys(finalUpdates).forEach(key => { if ((finalUpdates as any)[key] === undefined) { (finalUpdates as any)[key] = null; }});
        
        batch.update(taskRef, finalUpdates);
        await batch.commit();

        const updatedTask = { ...taskToUpdate, ...finalUpdates, id: taskId };
        await triggerWebhooks(organizationId, 'task.updated', updatedTask);
        
        return { data: { success: true, updatedTask }, error: null };

    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function cloneTaskAction(taskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean; clonedTaskTitle: string; } | null; error: string | null; }> {
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
          relations: [],
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
        return { data: { success: true, clonedTaskTitle: clonedTask.title }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function splitTaskAction(taskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) { throw new Error("Taak niet gevonden."); }

        const originalTask = taskDoc.data();
        if (!originalTask.subtasks || originalTask.subtasks.length < 2) {
            return { data: null, error: 'Een taak moet minimaal 2 subtaken hebben om te kunnen splitsen.' };
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
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function deleteTaskPermanentlyAction(taskId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if(!taskDoc.exists()) return { data: { success: true }, error: null };

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
        
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

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

export async function toggleTaskTimerAction(taskId: string, userId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
             throw new Error("Organisatie niet gevonden.");
        }
        const organization = orgDoc.data() as Organization;

        if (organization.settings?.features?.timeTracking === false) {
            return { data: null, error: 'Tijdregistratie is uitgeschakeld voor deze organisatie.' };
        }
        
        const taskRef = doc(db, "tasks", taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Taak niet gevonden");
        const task = taskDoc.data() as Task;
        
        const activeTimers = (task.activeTimerStartedAt || {}) as Record<string, Timestamp>;
        const myTimerIsRunning = !!activeTimers[userId];

        if (myTimerIsRunning) {
            // Stop timer
            const startTime = activeTimers[userId].toDate();
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const newTimeLogged = (task.timeLogged || 0) + elapsed;
            
            await updateDoc(taskRef, {
                timeLogged: newTimeLogged,
                [`activeTimerStartedAt.${userId}`]: deleteField(),
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestopt', `Totaal gelogd: ${formatTime(newTimeLogged)}`))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, timeLogged: newTimeLogged, activeTimerStartedAt: activeTimers, id: taskId});
            
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
            // Start timer
            await updateDoc(taskRef, {
                [`activeTimerStartedAt.${userId}`]: new Date(),
                history: arrayUnion(addHistoryEntry(userId, 'Tijdregistratie gestart'))
            });
            await triggerWebhooks(organizationId, 'task.updated', {...task, activeTimerStartedAt: { ...activeTimers, [userId]: new Date() }, id: taskId});
        }
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

export async function setChoreOfTheWeekAction(taskId: string, organizationId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
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
        return { data: { success: true }, error: null };
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
        const voterIds = option.voterIds || [];
        
        // Remove user's previous vote if it's a single vote poll
        if (!poll.isMultiVote) {
          const voterIndex = voterIds.indexOf(userId);
          if (voterIndex > -1) {
            voterIds.splice(voterIndex, 1);
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
        `${fromUserName} heeft taak "${taskData.title}" aan jou overgedragen.`,
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
