

'use server';

import type { Task, Organization } from '@/lib/types';
import { createNotification } from '@/app/actions/core/notification.actions';
import { triggerWebhooks } from '@/lib/integrations/webhook-service';
import { processTriggers } from '@/lib/integrations/automation-service';
import { CalendarSyncService } from './calendar-sync-service';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import { SYSTEM_USER_ID } from '@/lib/core/constants';

/**
 * Handles all side effects that should occur when a new task is created.
 * This is designed to be a "fire-and-forget" function.
 * @param task The newly created task object.
 * @param creatorName The name of the user who created the task.
 */
export async function handleTaskCreated(task: Task, creatorName: string) {
    // 1. Process Automations
    try {
        await processTriggers('task.created', { task });
    } catch (e) {
        console.error("Error processing automations for new task:", e);
    }

    // 2. Send Notifications
    try {
        if (task.assigneeIds.length > 0) {
            task.assigneeIds.forEach(assigneeId => {
              createNotification(assigneeId, `${creatorName} heeft je toegewezen aan: "${task.title}"`, task.id, task.organizationId, task.creatorId!, { eventType: 'assignment' });
            });
        }
        if (task.consultedUserIds && task.consultedUserIds.length > 0) {
            task.consultedUserIds.forEach(userId => {
              createNotification(userId, `${creatorName} wil je raadplegen over: "${task.title}"`, task.id, task.organizationId, task.creatorId!, { eventType: 'mention' });
            });
        }
        if (task.informedUserIds && task.informedUserIds.length > 0) {
            task.informedUserIds.forEach(userId => {
              createNotification(userId, `Je bent ter informatie toegevoegd aan: "${task.title}"`, task.id, task.organizationId, task.creatorId!, { eventType: 'mention' });
            });
        }
    } catch (e) {
         console.error("Error sending notifications for new task:", e);
    }

    // 3. Trigger Webhooks
    triggerWebhooks(task.organizationId, 'task.created', task).catch(console.error);

    // 4. Sync to Calendars
    if (task.dueDate && task.creatorId) {
        CalendarSyncService.syncEvent(task, task.creatorId).catch(console.error);
    }
}


/**
 * Handles all side effects that should occur when a task is updated.
 * @param updatedTask The new state of the task.
 * @param oldTask The state of the task before the update.
 * @param organization The full organization object.
 * @param userId The ID of the user who performed the update.
 * @param isDeletion A flag to indicate if this is part of a delete operation.
 */
export async function handleTaskUpdated(updatedTask: Task, oldTask: Task, organization: Organization, userId: string, isDeletion = false) {

    // 1. Trigger Webhooks
    triggerWebhooks(updatedTask.organizationId, isDeletion ? 'task.deleted' : 'task.updated', updatedTask).catch(console.error);
    
    // If it's a deletion, stop here after firing webhooks.
    if (isDeletion) {
        CalendarSyncService.deleteSyncedEvent(updatedTask).catch(console.error);
        return;
    }

    // 2. Process Automations
    try {
        await processTriggers('task.updated', { task: updatedTask, oldTask });
    } catch (e) {
        console.error("Error processing automations for updated task:", e);
    }

    // 3. Sync to Calendars if due date changed
    if (String(updatedTask.dueDate) !== String(oldTask.dueDate) && updatedTask.creatorId) {
        CalendarSyncService.syncEvent(updatedTask, updatedTask.creatorId).catch(console.error);
    }

    // 4. Send Notifications for new assignments
    try {
        const addedAssignees = (updatedTask.assigneeIds || []).filter(id => !(oldTask.assigneeIds || []).includes(id));
        addedAssignees.forEach(assigneeId => {
            createNotification(assigneeId, `Je bent toegewezen aan taak: "${updatedTask.title}"`, updatedTask.id, updatedTask.organizationId, userId, { eventType: 'assignment' });
        });
    } catch (e) {
        console.error("Error sending assignment notifications for updated task:", e);
    }

    // 5. Check for project budget notification threshold
    if (updatedTask.projectId && (updatedTask.cost !== oldTask.cost || updatedTask.status !== oldTask.status)) {
        try {
            const projectDoc = await getDoc(doc(db, 'projects', updatedTask.projectId));
            if (projectDoc.exists()) {
                const projectData = projectDoc.data();
                const thresholdConfig = organization.settings?.notificationThresholds?.projectBudget;
                
                if (thresholdConfig?.enabled && projectData.budget && !projectData.budgetNotificationSent) {
                    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', updatedTask.projectId));
                    const tasksSnapshot = await getDocs(tasksQuery);
                    const totalCost = tasksSnapshot.docs.reduce((sum, taskDoc) => sum + (taskDoc.data().cost || 0), 0);
                    const percentageUsed = (totalCost / projectData.budget) * 100;

                    if (percentageUsed >= thresholdConfig.percentage) {
                        const message = `Budgetwaarschuwing: Het budget voor project "${projectData.name}" is voor ${Math.round(percentageUsed)}% verbruikt.`;
                        await createNotification(organization.ownerId, message, null, organization.id, SYSTEM_USER_ID, { eventType: 'system' });
                        await updateDoc(projectDoc.ref, { budgetNotificationSent: true });
                    }
                }
            }
        } catch (e: any) {
            console.error("Failed to process budget threshold notification:", e.message);
        }
    }
}
