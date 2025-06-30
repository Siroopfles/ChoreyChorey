
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, Timestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import type { User, Task, Priority, Organization, Notification } from '@/lib/types';
import { isAfter, subMinutes } from 'date-fns';
import { sendSlackMessage } from '@/lib/slack-service';
import { sendTeamsMessage } from '@/lib/teams-service';
import { sendDiscordMessage } from '@/lib/discord-service';

// --- SERVER-SIDE PUSH NOTIFICATION LOGIC (Example for Cloud Function) ---
/*
To fully implement Web Push Notifications, you need server-side logic to send messages via FCM.
This typically lives in a Cloud Function that triggers when a new document is created in the 'notifications' collection.
This is beyond the scope of what I can implement directly, but here is an example of what that function would look like.
You would need to set up Firebase Functions in your project and deploy this code.

1. **Install Firebase Admin SDK:** `npm install firebase-admin` in your functions directory.
2. **Initialize Admin App:**
   ```typescript
   import * as admin from 'firebase-admin';
   admin.initializeApp();
   ```
3. **Create the Cloud Function:**
   ```typescript
   import * as functions from 'firebase-functions';
   import * as admin from 'firebase-admin';

   export const sendPushNotification = functions.firestore
     .document('notifications/{notificationId}')
     .onCreate(async (snap, context) => {
       const notification = snap.data();
       if (!notification) {
         console.log('No data associated with the event');
         return;
       }

       const userId = notification.userId;
       const userDoc = await admin.firestore().collection('users').doc(userId).get();
       const userData = userDoc.data();
       
       if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
         console.log('User has no FCM tokens.');
         return;
       }

       const payload = {
         notification: {
           title: 'Nieuwe Chorey Melding',
           body: notification.message,
           icon: '/icon-192x192.png',
           click_action: notification.taskId ? `/dashboard` : '/dashboard/inbox', // Simple navigation
         },
       };
       
       // Send to all tokens for the user
       const tokens = userData.fcmTokens;
       const response = await admin.messaging().sendToDevice(tokens, payload);

       // Clean up invalid tokens
       const tokensToRemove: Promise<any>[] = [];
       response.results.forEach((result, index) => {
         const error = result.error;
         if (error) {
           console.error('Failure sending notification to', tokens[index], error);
           if (error.code === 'messaging/invalid-registration-token' ||
               error.code === 'messaging/registration-token-not-registered') {
             tokensToRemove.push(
                admin.firestore().collection('users').doc(userId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens[index])
                })
             );
           }
         }
       });

       return Promise.all(tokensToRemove);
     });
   ```
*/
// --- END OF EXAMPLE ---


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
