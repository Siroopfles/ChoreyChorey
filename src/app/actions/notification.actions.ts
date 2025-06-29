
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, Timestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import type { User, Task, Priority, Organization, Notification } from '@/lib/types';
import { isAfter, subMinutes } from 'date-fns';
import { sendSlackMessage } from '@/lib/slack-service';
import { sendTeamsMessage } from '@/lib/teams-service';
import { sendDiscordMessage } from '@/lib/discord-service';

const priorityOrder: Record<Priority, number> = {
    'Laag': 0,
    'Midden': 1,
    'Hoog': 2,
    'Urgent': 3,
};

export async function createNotification(
  userId: string,
  message: string,
  taskId: string | null,
  organizationId: string,
  fromUserId: string,
  options: {
    eventType?: Notification['eventType'];
    taskTitle?: string;
  } = {}
) {
  if (userId === fromUserId) return; // Don't notify yourself
  
  try {
    const userToNotifyRef = doc(db, 'users', userId);
    const userToNotifyDoc = await getDoc(userToNotifyRef);

    if (!userToNotifyDoc.exists()) {
        return; // User to notify doesn't exist.
    }

    const userData = userToNotifyDoc.data() as User;
    
    // Check for muted tasks
    if (taskId && (userData.mutedTaskIds || []).includes(taskId)) {
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
            const userThreshold = userData.notificationSettings?.notificationPriorityThreshold || 'Laag';
            
            const taskPriorityLevel = priorityOrder[taskData.priority] ?? 0;
            const userThresholdLevel = priorityOrder[userThreshold] ?? 0;

            if (taskPriorityLevel < userThresholdLevel) {
                console.log(`Notification for ${userData.name} suppressed due to priority threshold.`);
                return;
            }
        }
    }
    
    // --- BUNDLING LOGIC ---
    if (taskId && options.eventType === 'comment' && options.taskTitle) {
        const fiveMinutesAgo = subMinutes(new Date(), 5);
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('taskId', '==', taskId),
            where('eventType', '==', 'comment'),
            where('createdAt', '>=', Timestamp.fromDate(fiveMinutesAgo))
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const mostRecentNotif = snapshot.docs.sort((a,b) => b.data().createdAt.toMillis() - a.data().createdAt.toMillis())[0];
            const notifRef = doc(db, 'notifications', mostRecentNotif.id);
            const bundleCount = (mostRecentNotif.data().bundleCount || 1) + 1;
            
            await updateDoc(notifRef, {
                message: `${bundleCount} nieuwe reacties op: "${options.taskTitle}"`,
                createdAt: new Date(),
                read: false,
                bundleCount: bundleCount,
                snoozedUntil: null,
            });
            return; // Exit after bundling
        }
    }
      
    // If all checks pass, create the in-app notification
    const newNotificationData: Omit<Notification, 'id'> = {
      userId,
      message,
      taskId,
      organizationId,
      read: false,
      createdAt: new Date(),
      eventType: options.eventType,
    };
    if(options.eventType === 'comment') {
        (newNotificationData as any).bundleCount = 1;
    }

    await addDoc(collection(db, 'notifications'), newNotificationData);

    // Trigger external notifications
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (orgDoc.exists()) {
        const orgData = orgDoc.data() as Organization;
        
        // Slack
        const slackConfig = orgData.settings?.slack;
        if (slackConfig?.enabled && slackConfig.channelId) {
            sendSlackMessage(slackConfig.channelId, message).catch(console.error);
        }

        // Microsoft Teams
        const teamsConfig = orgData.settings?.teams;
        if (teamsConfig?.enabled && teamsConfig.webhookUrl) {
            sendTeamsMessage(teamsConfig.webhookUrl, message).catch(console.error);
        }

        // Discord
        const discordConfig = orgData.settings?.discord;
        if (discordConfig?.enabled && discordConfig.webhookUrl) {
            sendDiscordMessage(discordConfig.webhookUrl, message).catch(console.error);
        }
    }
  } catch (e) {
    console.error(`Error creating notification for user ${userId}:`, e);
  }
};
