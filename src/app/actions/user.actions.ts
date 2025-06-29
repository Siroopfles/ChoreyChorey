
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction } from 'firebase/firestore';
import type { GlobalUserProfile, Organization, OrganizationMember } from '@/lib/types';


// This action now only updates the global user profile.
export async function updateUserProfile(userId: string, data: Partial<Omit<GlobalUserProfile, 'id' | 'organizationIds' | 'currentOrganizationId'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        // Firestore doesn't like 'undefined' values from optional Zod fields
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        await updateDoc(userRef, cleanData);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function purchaseCosmeticItem(organizationId: string, userId: string, cost: number, updates: { [key: string]: string }) {
    if (cost < 0) {
        return { error: 'Kosten kunnen niet negatief zijn.' };
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
        
        return { success: true };
    } catch (error: any) {
        console.error("Error purchasing cosmetic item:", error);
        return { error: error.message };
    }
}
