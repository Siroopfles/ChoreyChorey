'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, getDoc, increment, collection, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { User, UserStatus } from '@/lib/types';

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar' | 'skills'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function toggleSkillEndorsement(targetUserId: string, skill: string, endorserId: string) {
    if (targetUserId === endorserId) {
        return { error: 'Je kunt je eigen vaardigheden niet onderschrijven.' };
    }
    
    try {
        const targetUserRef = doc(db, 'users', targetUserId);
        
        await runTransaction(db, async (transaction) => {
            const targetUserDoc = await transaction.get(targetUserRef);
            if (!targetUserDoc.exists()) {
                throw new Error("Doelgebruiker niet gevonden.");
            }

            const targetUserData = targetUserDoc.data() as User;
            const endorsements = targetUserData.endorsements || {};
            const skillEndorsers = endorsements[skill] || [];

            const endorserUserRef = doc(db, 'users', endorserId);
            const endorserUserDoc = await transaction.get(endorserUserRef);
            if (!endorserUserDoc.exists()) {
                throw new Error("Onderschrijver niet gevonden.");
            }

            const fieldPath = `endorsements.${skill}`;
            if (skillEndorsers.includes(endorserId)) {
                // User has already endorsed, so retract endorsement
                transaction.update(targetUserRef, { [fieldPath]: arrayRemove(endorserId) });
            } else {
                // User has not endorsed, so add endorsement
                transaction.update(targetUserRef, { [fieldPath]: arrayUnion(endorserId) });
            }
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling skill endorsement:", error);
        return { error: error.message };
    }
}

export async function transferPoints(fromUserId: string, toUserId: string, amount: number, message: string) {
    if (fromUserId === toUserId) {
        return { error: 'Je kunt geen punten aan jezelf geven.' };
    }
    if (amount <= 0) {
        return { error: 'Je moet een positief aantal punten geven.' };
    }
    
    try {
        let fromUserName = 'Een gebruiker';
        await runTransaction(db, async (transaction) => {
            const fromUserRef = doc(db, 'users', fromUserId);
            const toUserRef = doc(db, 'users', toUserId);

            const fromUserDoc = await transaction.get(fromUserRef);

            if (!fromUserDoc.exists()) {
                throw new Error("Verzender niet gevonden.");
            }
            
            const fromUserData = fromUserDoc.data() as User;
            fromUserName = fromUserData.name;

            if ((fromUserData.points || 0) < amount) {
                throw new Error("Je hebt niet genoeg punten om te geven.");
            }

            // Decrement points from sender
            transaction.update(fromUserRef, { points: increment(-amount) });

            // Increment points for receiver
            transaction.update(toUserRef, { points: increment(amount) });
        });

        // Create notification for the receiver
        const notificationMessage = `${fromUserName} heeft je ${amount} punten gegeven! ${message ? `Bericht: "${message}"` : ''}`;
        
        await addDoc(collection(db, 'notifications'), {
            userId: toUserId,
            message: notificationMessage,
            read: false,
            createdAt: new Date(),
        });

        return { success: true, amount };
    } catch (error: any) {
        console.error("Error transferring points:", error);
        return { error: error.message };
    }
}

export async function updateUserStatus(userId: string, status: UserStatus) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { status });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user status:", error);
        return { error: error.message };
    }
}
