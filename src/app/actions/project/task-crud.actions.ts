
'use server';

import { db } from '@/lib/core/firebase';
import { collection, writeBatch, doc, getDocs, query, where, addDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import type { User, Task, TaskFormValues, Status, Recurring, Subtask, Organization, Project } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import { handleTaskCreated, handleTaskUpdated } from '@/lib/services/task-event-service';
import { grantAchievements, checkAndGrantTeamAchievements } from '@/app/actions/core/gamification.actions';
import { calculateNextDueDate } from '@/lib/utils/time-utils';


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
          gitlabLinks: taskData.gitlabLinks || [],
          bitbucketLinks: taskData.bitbucketLinks || [],
          jiraLinks: taskData.jiraLinks || [],
          jiraLinkKeys: (taskData.jiraLinks || []).map(link => link.key),
          helpNeeded: taskData.helpNeeded ?? false,
          isChoreOfTheWeek: false,
          customFieldValues: taskData.customFieldValues || {},
          poll: taskData.poll ? { ...taskData.poll, options: taskData.poll.options.map(o => ({...o, id: crypto.randomUUID()}))} : null,
          whiteboard: null,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        const newTask = { ...firestoreTask, id: docRef.id };
        
        // Fire-and-forget event handling
        handleTaskCreated(newTask, creatorName).catch(console.error);

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
        
        const oldTask = { ...taskDoc.data(), id: taskDoc.id } as Task;
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const organization = orgDoc.data() as Organization;
        const showGamification = organization.settings?.features?.gamification !== false;

        const finalUpdates: { [key: string]: any } = { ...updates };
        const newHistory = [];
        const batch = writeBatch(db);

        if (updates.githubLinks) finalUpdates.githubLinkUrls = updates.githubLinks.map(link => link.url);
        if (updates.jiraLinks) finalUpdates.jiraLinkKeys = updates.jiraLinks.map(link => link.key);
        if (updates.poll && !oldTask.poll) {
             finalUpdates.poll.options = updates.poll.options.map(o => ({...o, id: crypto.randomUUID()}));
        }

        if (updates.relations) {
            const oldRelations = oldTask.relations?.map(r => `${r.type}:${r.taskId}`).sort().join(',') || '';
            const newRelations = updates.relations.map(r => `${r.type}:${r.taskId}`).sort().join(',') || '';
            if (oldRelations !== newRelations) {
                newHistory.push(addHistoryEntry(userId, `Relaties gewijzigd`));
            }
        }
        
        const fieldsToTrack: (keyof Task)[] = ['status', 'priority', 'dueDate', 'title', 'projectId', 'reviewerId', 'cost'];
        fieldsToTrack.forEach(field => {
            if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(oldTask[field])) {
                let oldValue = field === 'dueDate' ? (oldTask[field] ? (oldTask[field] as Date).toLocaleDateString() : 'geen') : (oldTask[field] || 'leeg');
                let newValue = field === 'dueDate' ? (updates[field] ? (updates[field] as Date).toLocaleDateString() : 'geen') : (updates[field] || 'leeg');
                newHistory.push(addHistoryEntry(userId, `Veld '${field}' gewijzigd`, `van "${oldValue}" naar "${newValue}"`));
            }
        });

        // Handle isBlocked updates based on 'blockedBy' changes
        if (updates.blockedBy) {
            const blockingTasksQuery = query(collection(db, 'tasks'), where('__name__', 'in', updates.blockedBy));
            const blockingTasksSnapshot = await getDocs(blockingTasksQuery);
            const activeBlockers = blockingTasksSnapshot.docs.some(doc => doc.data().status !== 'Voltooid');
            finalUpdates.isBlocked = activeBlockers;
        }

        if (updates.status === 'Voltooid' && oldTask.status !== 'Voltooid') {
            finalUpdates.completedAt = new Date();
            if(showGamification && oldTask.assigneeIds.length > 0) {
                 await Promise.all(oldTask.assigneeIds.map(assigneeId => 
                    grantAchievements(assigneeId, organizationId, 'completed', { ...oldTask, status: 'Voltooid' })
                ));
            }
            if (oldTask.teamId) {
                checkAndGrantTeamAchievements(oldTask.teamId, organizationId).catch(console.error);
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

            if (oldTask.recurring) {
                const nextDueDate = calculateNextDueDate(oldTask.dueDate, oldTask.recurring);
                const newTaskData: any = { ...oldTask, recurring: oldTask.recurring, status: 'Te Doen' as Status, dueDate: nextDueDate, createdAt: new Date(), subtasks: oldTask.subtasks.map(s => ({...s, completed: false })), comments: [], history: [addHistoryEntry(userId, 'Automatisch aangemaakt', `Herhaling van taak ${oldTask.id}`)], order: Date.now(), thanked: false, };
                delete newTaskData.id;
                delete newTaskData.completedAt;
                const newDocRef = doc(collection(db, 'tasks'));
                batch.set(newDocRef, newTaskData);
                handleTaskCreated({ ...newTaskData, id: newDocRef.id }, 'Systeem').catch(console.error);
            }
        }
        
        if (newHistory.length > 0) finalUpdates.history = arrayUnion(...newHistory);
        if (updates.status && updates.status !== oldTask.status) finalUpdates.order = Date.now();
        
        Object.keys(finalUpdates).forEach(key => { if ((finalUpdates as any)[key] === undefined) { (finalUpdates as any)[key] = null; }});
        
        batch.update(taskRef, finalUpdates);
        await batch.commit();

        const updatedTask = { ...oldTask, ...finalUpdates, id: taskId };
        handleTaskUpdated(updatedTask, oldTask, organization, userId).catch(console.error);
        
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
        handleTaskCreated({ ...clonedTask, id: docRef.id }, 'Systeem').catch(console.error);

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

        const newTask = { ...newTaskData, id: newTaskRef.id };
        const updatedOldTask = { ...originalTask, id: taskRef.id, subtasks: originalSubtasks };
        
        handleTaskCreated(newTask, 'Systeem').catch(console.error);
        handleTaskUpdated(updatedOldTask, originalTask as Task, {} as Organization, userId).catch(console.error);

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
        
        // Fire-and-forget event handling
        handleTaskUpdated(taskData, taskData, {} as Organization, 'system', true).catch(console.error);
        
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
