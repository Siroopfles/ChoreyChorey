

'use server';

import { db } from '@/lib/core/firebase';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';

export async function manageFcmToken(userId: string, token: string, action: 'add' | 'remove'): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    if (action === 'add') {
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
    } else if (action === 'remove') {
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token),
      });
    }
  } catch (error) {
    console.error('Error managing FCM token:', error);
  }
}
