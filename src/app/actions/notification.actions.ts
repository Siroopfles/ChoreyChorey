'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { isAfter } from 'date-fns';

export async function createNotification(userId: string, message: string, taskId: string, organizationId: string, fromUserId: string) {
  if (userId === fromUserId) return; // Don't notify yourself
  
  try {
    const userToNotifyRef = doc(db, 'users', userId);
    const userToNotifyDoc = await getDoc(userToNotifyRef);

    if (userToNotifyDoc.exists()) {
      const userData = userToNotifyDoc.data() as User;
      
      if (userData.mutedTaskIds?.includes(taskId)) {
          console.log(`Notification for ${userData.name} suppressed because task ${taskId} is muted.`);
          return;
      }

      if (userData.status?.type === 'Niet storen') {
        const dndUntil = (userData.status.until as Timestamp | null)?.toDate();
        if (!dndUntil || isAfter(dndUntil, new Date())) {
          console.log(`Notification for ${userData.name} suppressed due to DND status.`);
          return;
        }
      }
    }

    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      taskId,
      organizationId,
      read: false,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error(`Error creating notification for user ${userId}:`, e);
    // Don't re-throw, creating a notification is not a critical failure
  }
};
