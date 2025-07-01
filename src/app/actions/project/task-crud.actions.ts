
'use server';

import { db } from '@/lib/core/firebase';
import { collection, writeBatch, doc, getDocs, query, where, addDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import type { User, Task, TaskFormValues, Status, Recurring, Subtask, Organization, Project } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import { createNotification } from '@/app/actions/core/notification.actions';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import Papa from 'papaparse';
import { addDays, addMonths, isBefore, startOfMonth, getDay, setDate, isAfter, addWeeks } from 'date-fns';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/integrations/google-calendar-service';
import { createMicrosoftCalendarEvent, updateMicrosoftCalendarEvent, deleteMicrosoftCalendarEvent } from '@/lib/integrations/microsoft-graph-service';
import { grantAchievements, checkAndGrantTeamAchievements } from '@/app/actions/core/gamification.actions';
import { SYSTEM_USER_ID } from '@/lib/core/constants';

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
          whiteboard: null,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        // Trigger automations for the new task
        try {
            const { processTriggers } = await import('@/lib/integrations/automation-service');
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

        // Check for project budget notification threshold
        if (updatedTask.projectId && (updates.cost !== undefined || updates.status === 'Voltooid')) {
            try {
                const projectDoc = await getDoc(doc(db, 'projects', updatedTask.projectId));
                if (projectDoc.exists()) {
                    const projectData = projectDoc.data() as Project;
                    const thresholdConfig = organization.settings?.notificationThresholds?.projectBudget;
                    
                    if (thresholdConfig?.enabled && projectData.budget && !projectData.budgetNotificationSent) {
                        const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', updatedTask.projectId));
                        const tasksSnapshot = await getDocs(tasksQuery);
                        const totalCost = tasksSnapshot.docs.reduce((sum, taskDoc) => sum + (taskDoc.data().cost || 0), 0);

                        const percentageUsed = (totalCost / projectData.budget) * 100;
                        if (percentageUsed >= thresholdConfig.percentage) {
                            const message = `Budgetwaarschuwing: Het budget voor project "${projectData.name}" is voor ${Math.round(percentageUsed)}% verbruikt.`;
                            await createNotification(
                                organization.ownerId, 
                                message, 
                                null, 
                                organizationId, 
                                SYSTEM_USER_ID, 
                                { eventType: 'system' }
                            );
                            await updateDoc(projectDoc.ref, { budgetNotificationSent: true });
                        }
                    }
                }
            } catch (e: any) {
                console.error("Failed to process budget threshold notification:", e.message);
            }
        }
        
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
