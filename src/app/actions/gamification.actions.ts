'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, writeBatch, query, where, getDocs, increment, arrayUnion, runTransaction, addDoc } from 'firebase/firestore';
import type { Task, User } from '@/lib/types';
import { ACHIEVEMENTS } from '@/lib/types';

async function grantAchievements(userId: string, type: 'completed' | 'thanked', task?: Task) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return { granted: [] };

    const userData = userDoc.data() as User;
    const userAchievements = userData.achievements || [];
    const achievementsToGrant: { id: string, name: string }[] = [];

    if (type === 'completed' && task) {
        const completedTasksQuery = query(collection(db, 'tasks'), where('assigneeIds', 'array-contains', userId), where('status', '==', 'Voltooid'));
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        const totalCompleted = completedTasksSnapshot.size;

        if (totalCompleted === 1 && !userAchievements.includes(ACHIEVEMENTS.FIRST_TASK.id)) {
            achievementsToGrant.push({id: ACHIEVEMENTS.FIRST_TASK.id, name: ACHIEVEMENTS.FIRST_TASK.name});
        }
        
        if (task.creatorId && task.creatorId !== userId && !userAchievements.includes(ACHIEVEMENTS.COMMUNITY_HELPER.id)) {
            achievementsToGrant.push({id: ACHIEVEMENTS.COMMUNITY_HELPER.id, name: ACHIEVEMENTS.COMMUNITY_HELPER.name});
        }

        if (totalCompleted >= 10 && !userAchievements.includes(ACHIEVEMENTS.TEN_TASKS.id)) {
            achievementsToGrant.push({id: ACHIEVEMENTS.TEN_TASKS.id, name: ACHIEVEMENTS.TEN_TASKS.name});
        }
    }
    
    if (type === 'thanked') {
         if (!userAchievements.includes(ACHIEVEMENTS.APPRECIATED.id)) {
            achievementsToGrant.push({id: ACHIEVEMENTS.APPRECIATED.id, name: ACHIEVEMENTS.APPRECIATED.name});
        }
    }

    if (achievementsToGrant.length > 0) {
        await updateDoc(userRef, {
            achievements: arrayUnion(...achievementsToGrant.map(a => a.id))
        });
        return { granted: achievementsToGrant };
    }
    return { granted: [] };
}


export async function thankForTask(taskId: string, currentUserId: string, assignees: User[]) {
    if (!currentUserId) return { error: 'Niet geautoriseerd.'};
    if (assignees.length === 0) return { error: 'Geen toegewezenen om te bedanken.'};

    try {
        const batch = writeBatch(db);
        const points = 5; // Bonus points for being thanked
        
        assignees.forEach(assignee => {
          const assigneeRef = doc(db, 'users', assignee.id);
          batch.update(assigneeRef, { points: increment(points) });
        });
        
        const assigneesNames = assignees.map(u => u.name).join(', ');
        const historyEntry = {
            id: crypto.randomUUID(),
            userId: currentUserId,
            timestamp: new Date(),
            action: 'Bedankje gegeven',
            details: `aan ${assigneesNames}`,
        };
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, { 
            thanked: true,
            history: arrayUnion(historyEntry)
        });

        await batch.commit();

        const achievementPromises = assignees.map(assignee => grantAchievements(assignee.id, 'thanked'));
        await Promise.all(achievementPromises);
        
        return { success: true, points, assigneesNames };
    } catch (e: any) {
        return { error: e.message };
    }
}


export async function rateTask(taskId: string, rating: number, task: Task, currentUserId: string) {
    if (!currentUserId) return { error: 'Niet geautoriseerd.' };
    
    const canRate = task.creatorId === currentUserId && !task.assigneeIds.includes(currentUserId);
    if (!canRate) {
        return { error: 'Alleen de maker van de taak kan een beoordeling geven, tenzij ze de taak zelf hebben uitgevoerd.' };
    }

    if (task.rating) {
        return { error: 'Deze taak heeft al een beoordeling.' };
    }

    try {
        const batch = writeBatch(db);
        const taskRef = doc(db, 'tasks', taskId);

        const historyEntry = {
            id: crypto.randomUUID(),
            userId: currentUserId,
            timestamp: new Date(),
            action: 'Taak beoordeeld',
            details: `Gaf een beoordeling van ${rating} sterren.`,
        };
        batch.update(taskRef, {
            rating: rating,
            history: arrayUnion(historyEntry)
        });

        const bonusPoints = rating;
        if (task.assigneeIds.length > 0) {
            task.assigneeIds.forEach(assigneeId => {
                const userRef = doc(db, 'users', assigneeId);
                batch.update(userRef, { points: increment(bonusPoints) });
            });
        }
        
        await batch.commit();
        return { success: true, bonusPoints };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function transferPoints(fromUserId: string, toUserId: string, amount: number, message: string, fromUserName: string) {
    if (fromUserId === toUserId) {
        return { error: 'Je kunt geen punten aan jezelf geven.' };
    }
    if (amount <= 0) {
        return { error: 'Je moet een positief aantal punten geven.' };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const fromUserRef = doc(db, 'users', fromUserId);
            const toUserRef = doc(db, 'users', toUserId);

            const fromUserDoc = await transaction.get(fromUserRef);

            if (!fromUserDoc.exists()) {
                throw new Error("Verzender niet gevonden.");
            }
            
            const fromUserData = fromUserDoc.data() as User;

            if ((fromUserData.points || 0) < amount) {
                throw new Error("Je hebt niet genoeg punten om te geven.");
            }

            transaction.update(fromUserRef, { points: increment(-amount) });
            transaction.update(toUserRef, { points: increment(amount) });
        });

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


export { grantAchievements };
