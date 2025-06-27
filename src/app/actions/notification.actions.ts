
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { User, Task, Priority, Organization } from '@/lib/types';
import { isAfter } from 'date-fns';
import { sendSlackMessage } from '@/lib/slack-service';

const priorityOrder: Record<Priority, number> = {
    'Laag': 0,
    'Midden': 1,
    'Hoog': 2,
    'Urgent': 3,
};

export async function createNotification(userId: string, message: string, taskId: string | null, organizationId: string, fromUserId: string) {
  if (userId === fromUserId) return; // Don't notify yourself
  
  try {
    const userToNotifyRef = doc(db, 'users', userId);
    const userToNotifyDoc = await getDoc(userToNotifyRef);

    if (!userToNotifyDoc.exists()) {
        return; // User to notify doesn't exist.
    }

    const userData = userToNotifyDoc.data() as User;
    
    // Check for muted tasks
    if (taskId && userData.mutedTaskIds?.includes(taskId)) {
        console.log(`Notification for ${userData.name} suppressed because task ${taskId} is muted.`);
        return;
    }

    // Check for DND status
    if (userData.status?.type === 'Niet storen') {
      const dndUntil = (userData.status.until as Timestamp | null)?.toDate() ?? null;
      if (!dndUntil || isAfter(dndUntil, new Date())) {
        console.log(`Notification for ${userData.name} suppressed due to DND status.`);
        return;
      }
    }
    
    // Check for priority threshold if the notification is for a task
    if (taskId) {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (taskDoc.exists()) {
            const taskData = taskDoc.data() as Task;
            // Default to 'Laag' if not set, meaning all notifications are sent by default
            const userThreshold = userData.notificationSettings?.notificationPriorityThreshold || 'Laag';
            
            const taskPriorityLevel = priorityOrder[taskData.priority] ?? 0;
            const userThresholdLevel = priorityOrder[userThreshold] ?? 0;

            if (taskPriorityLevel < userThresholdLevel) {
                console.log(`Notification for ${userData.name} suppressed due to priority threshold.`);
                return; // Suppress notification because task priority is below user's threshold
            }
        }
    }
      
    // If all checks pass, create the in-app notification
    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      taskId,
      organizationId,
      read: false,
      createdAt: new Date(),
    });

    // Trigger external notifications (e.g., Slack)
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (orgDoc.exists()) {
        const orgData = orgDoc.data() as Organization;
        const slackConfig = orgData.settings?.slack;
        if (slackConfig?.enabled && slackConfig.channelId) {
            // Fire-and-forget
            sendSlackMessage(slackConfig.channelId, message).catch(console.error);
        }
    }
  } catch (e) {
    console.error(`Error creating notification for user ${userId}:`, e);
    // Don't re-throw, creating a notification is not a critical failure
  }
};
