

'use server';

import { db } from '@/lib/core/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { generateAvatar } from '@/ai/flows/generative-ai/generate-avatar-flow';
import type { GlobalUserProfile } from '@/lib/types/auth';
import type { OrganizationMember } from '@/lib/types/organizations';

export async function endorseSkill(organizationId: string, userId: string, skill: string, endorserId: string) {
  try {
    const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
    
    await runTransaction(db, async (transaction) => {
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) {
          throw new Error('Gebruiker niet gevonden in deze organisatie.');
        }
    
        const memberData = memberDoc.data() as OrganizationMember;
        const endorsements = memberData.endorsements || {};
        const skillEndorsements = endorsements[skill] || [];

        if (skillEndorsements.includes(endorserId)) {
            // User already endorsed, so we remove it (toggle off)
            transaction.update(memberRef, { [`endorsements.${skill}`]: arrayRemove(endorserId) });
        } else {
            // User has not endorsed yet, so we add it (toggle on)
            transaction.update(memberRef, { [`endorsements.${skill}`]: arrayUnion(endorserId) });
        }
    });

    revalidatePath(`/dashboard/profile/${userId}`); // Revalidate the user's profile page
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error endorsing skill:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het onderschrijven van de vaardigheid.' };
  }
}

export async function updateUserProfile(userId: string, data: Partial<GlobalUserProfile>): Promise<{ success: boolean, error: string | null }> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function manageFcmToken(userId: string, token: string, action: 'add' | 'remove') {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        fcmTokens: action === 'add' ? arrayUnion(token) : arrayRemove(token),
    });
}

export async function generateAvatarAction(userId: string, name: string): Promise<{ avatarUrl?: string, error?: string }> {
    try {
        const { avatarUrl } = await generateAvatar({ userId, name });
        return { avatarUrl };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function purchaseCosmeticItem(
  organizationId: string,
  userId: string,
  cost: number,
  updates: { [key: string]: string }
): Promise<{ success: boolean; error: string | null }> {
  const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
  try {
    await runTransaction(db, async (transaction) => {
      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists()) {
        throw new Error("Gebruiker niet gevonden in organisatie.");
      }
      const currentPoints = memberDoc.data().points || 0;
      if (currentPoints < cost) {
        throw new Error("Niet genoeg punten.");
      }
      const newPoints = currentPoints - cost;
      
      const updateData: { [key: string]: any } = {
        points: newPoints,
      };
      
      for (const key in updates) {
        updateData[`cosmetic.${key}`] = updates[key];
      }

      transaction.update(memberRef, updateData);
    });
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
