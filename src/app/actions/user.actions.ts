
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { GlobalUserProfile, Organization, OrganizationMember } from '@/lib/types';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';


// This action now only updates the global user profile.
export async function updateUserProfile(userId: string, data: Partial<Omit<GlobalUserProfile, 'id' | 'organizationIds' | 'currentOrganizationId'>>): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    try {
        const userRef = doc(db, 'users', userId);
        // Firestore doesn't like 'undefined' values from optional Zod fields
        const cleanData: { [key: string]: any } = {};
        for (const key in data) {
            if ((data as any)[key] !== undefined) {
                cleanData[key] = (data as any)[key];
            }
        }
        
        await updateDoc(userRef, cleanData);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { data: null, error: error.message };
    }
}

export async function generateAvatarAction(userId: string, name: string) {
    return generateAvatar({ userId, name });
}

export async function purchaseCosmeticItem(organizationId: string, userId: string, cost: number, updates: { [key: string]: string }): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (cost < 0) {
        return { data: null, error: 'Kosten kunnen niet negatief zijn.' };
    }
    
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        await runTransaction(db, async (transaction) => {
            const orgDoc = await transaction.get(orgRef);

            if (!orgDoc.exists()) {
                throw new Error("Organisatie niet gevonden.");
            }
            
            const orgData = orgDoc.data() as Organization;
            const memberData = orgData.members?.[userId];
            
            if (!memberData) {
                throw new Error("Lid niet gevonden.");
            }

            if ((memberData.points || 0) < cost) {
                throw new Error("Je hebt niet genoeg punten voor dit item.");
            }

            const newPoints = (memberData.points || 0) - cost;
            
            const cosmeticUpdates: { [key: string]: any } = {
                [`members.${userId}.points`]: newPoints
            };

            for (const [key, value] of Object.entries(updates)) {
                cosmeticUpdates[`members.${userId}.cosmetic.${key}`] = value;
            }

            transaction.update(orgRef, cosmeticUpdates);
        });
        
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error purchasing cosmetic item:", error);
        return { data: null, error: error.message };
    }
}

export async function endorseSkill(
  organizationId: string,
  targetUserId: string,
  skill: string,
  endorserId: string
): Promise<{ success: boolean; error?: string }> {
  if (targetUserId === endorserId) {
    return { success: false, error: "Je kunt je eigen vaardigheden niet onderschrijven." };
  }
  
  const orgRef = doc(db, 'organizations', organizationId);
  
  try {
    // The `members` field is a map, so we use dot notation to update a nested field.
    // `arrayUnion` ensures an ID is only added once.
    await updateDoc(orgRef, {
      [`members.${targetUserId}.endorsements.${skill}`]: arrayUnion(endorserId)
    });
    return { success: true };
  } catch (e: any) {
    console.error("Error endorsing skill:", e);
    return { success: false, error: e.message };
  }
}

export async function manageFcmToken(
  userId: string,
  token: string,
  action: 'add' | 'remove'
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: action === 'add' ? arrayUnion(token) : arrayRemove(token),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error managing FCM token:", error);
    return { success: false, error: error.message };
  }
}
