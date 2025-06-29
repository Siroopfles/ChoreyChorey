

'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, writeBatch, query, where, getDocs, increment, arrayUnion, runTransaction, addDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Task, User, Organization, ActivityFeedItem, Team, GlobalUserProfile, OrganizationMember } from '@/lib/types';
import { ACHIEVEMENTS } from '@/lib/types';
import { createNotification } from './notification.actions';
import { addHistoryEntry, calculatePoints } from '@/lib/utils';

async function grantAchievements(userId: string, organizationId: string, type: 'completed' | 'thanked', task?: Task) {
    const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
    
    // Use a transaction to ensure atomic reads and writes, especially for streak data.
    const { grantedAchievements, streakToastMessage } = await runTransaction(db, async (transaction) => {
        const memberDoc = await transaction.get(memberRef);
        if (!memberDoc.exists()) return { grantedAchievements: [], streakToastMessage: null };

        const memberData = memberDoc.data() as OrganizationMember;
        const userAchievements = memberData.achievements || [];
        const achievementsToGrant: { id: string, name: string }[] = [];
        let toastMessage: string | null = null;
        
        // Gamification logic for completing a task
        if (type === 'completed' && task) {
            // Point and Streak Calculation
            const basePoints = calculatePoints(task.priority, task.storyPoints);
            const streakData = memberData.streakData;
            const today = new Date();
            let newStreak = 1;
            let showStreakToast = true;

            if (streakData?.lastCompletionDate) {
                const lastCompletion = (streakData.lastCompletionDate as Timestamp).toDate();
                const { isToday, isYesterday } = await import('date-fns');
                
                if (isToday(lastCompletion)) {
                    newStreak = streakData.currentStreak;
                    showStreakToast = false;
                } else if (isYesterday(lastCompletion)) {
                    newStreak = (streakData.currentStreak || 0) + 1;
                } else {
                    newStreak = 1;
                }
            }
            
            const bonusPoints = Math.min(newStreak * 5, 50); // Cap bonus points
            const totalPointsToAdd = basePoints + bonusPoints;
            
            transaction.update(memberRef, {
                points: increment(totalPointsToAdd),
                streakData: { currentStreak: newStreak, lastCompletionDate: today }
            });

            if (showStreakToast && newStreak > 1) {
                toastMessage = `Streak! 🔥 Je bent ${newStreak} dag(en) op rij bezig! +${bonusPoints} bonuspunten.`;
            }

            // Achievement Checks
            const completedTasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', organizationId), where('assigneeIds', 'array-contains', userId), where('status', '==', 'Voltooid'));
            const completedTasksSnapshot = await getDocs(completedTasksQuery); // Note: This is outside the transaction read, which is a limitation. For high-concurrency apps, this might need a different approach (e.g., counters).
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
        
        // Gamification logic for being thanked
        if (type === 'thanked') {
             if (!userAchievements.includes(ACHIEVEMENTS.APPRECIATED.id)) {
                achievementsToGrant.push({id: ACHIEVEMENTS.APPRECIATED.id, name: ACHIEVEMENTS.APPRECIATED.name});
            }
        }

        if (achievementsToGrant.length > 0) {
            transaction.update(memberRef, {
                achievements: arrayUnion(...achievementsToGrant.map(a => a.id))
            });
        }
        
        return { grantedAchievements: achievementsToGrant, streakToastMessage: toastMessage };
    });

    // Handle notifications outside of the transaction
    if (streakToastMessage && task) {
         createNotification(userId, streakToastMessage, task.id, organizationId, 'system', { eventType: 'gamification' });
    }
    
    if (grantedAchievements.length > 0) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data() as GlobalUserProfile;
            const batch = writeBatch(db);
            grantedAchievements.forEach(ach => {
                const activityRef = doc(collection(db, 'organizations', organizationId, 'activityFeed'));
                batch.set(activityRef, {
                    organizationId: organizationId,
                    timestamp: new Date(),
                    type: 'achievement',
                    userId: userId,
                    userName: userData.name,
                    userAvatar: userData.avatar,
                    details: {
                        achievementId: ach.id,
                        achievementName: ach.name,
                    }
                });
            });
            await batch.commit();
        }
    }

    return { granted: grantedAchievements };
}


export async function thankForTask(taskId: string, currentUserId: string, assignees: User[], organizationId: string) {
    if (!currentUserId) return { error: 'Niet geautoriseerd.'};
    if (assignees.length === 0) return { error: 'Geen toegewezenen om te bedanken.'};

    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) return { error: 'Organisatie niet gevonden.'};
        const orgData = orgDoc.data() as Organization;
        if (orgData.settings?.features?.gamification === false) {
            return { success: true }; // Silently succeed
        }

        const batch = writeBatch(db);
        const points = 5;
        const fromUserDoc = await getDoc(doc(db, 'users', currentUserId));
        const fromUserData = fromUserDoc.data() as GlobalUserProfile;
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        const taskData = taskDoc.data() as Task;
        
        assignees.forEach(assignee => {
          const assigneeMemberRef = doc(db, 'organizations', organizationId, 'members', assignee.id);
          batch.update(assigneeMemberRef, { points: increment(points) });

          const activityRef = doc(collection(db, 'organizations', organizationId, 'activityFeed'));
          batch.set(activityRef, {
              organizationId: organizationId,
              timestamp: new Date(),
              type: 'kudos',
              userId: currentUserId,
              userName: fromUserData.name,
              userAvatar: fromUserData.avatar,
              details: {
                  recipientId: assignee.id,
                  recipientName: assignee.name,
                  taskId: taskId,
                  taskTitle: taskData.title,
                  points: points,
              }
          });
        });
        
        const assigneesNames = assignees.map(u => u.name).join(', ');
        const historyEntry = addHistoryEntry(currentUserId, 'Bedankje gegeven', `aan ${assigneesNames}`);
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, { 
            thanked: true,
            history: arrayUnion(historyEntry)
        });

        await batch.commit();

        const achievementPromises = assignees.map(assignee => grantAchievements(assignee.id, organizationId, 'thanked'));
        await Promise.all(achievementPromises);
        
        return { success: true, points, assigneesNames };
    } catch (e: any) {
        return { error: e.message };
    }
}


export async function rateTask(taskId: string, rating: number, task: Task, currentUserId: string, organizationId: string) {
    if (!currentUserId) return { error: 'Niet geautoriseerd.' };
    
    const canRate = task.creatorId === currentUserId && !task.assigneeIds.includes(currentUserId);
    if (!canRate) {
        return { error: 'Alleen de maker van de taak kan een beoordeling geven, tenzij ze de taak zelf hebben uitgevoerd.' };
    }

    if (task.rating) {
        return { error: 'Deze taak heeft al een beoordeling.' };
    }

    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) return { error: 'Organisatie niet gevonden.'};
        const orgData = orgDoc.data() as Organization;
        if (orgData.settings?.features?.gamification === false) {
            return { success: true }; // Silently succeed
        }

        const batch = writeBatch(db);
        const taskRef = doc(db, 'tasks', taskId);

        const historyEntry = addHistoryEntry(currentUserId, 'Taak beoordeeld', `Gaf een beoordeling van ${rating} sterren.`);
        batch.update(taskRef, {
            rating: rating,
            history: arrayUnion(historyEntry)
        });

        const bonusPoints = rating;
        if (task.assigneeIds.length > 0) {
            task.assigneeIds.forEach(assigneeId => {
                const memberRef = doc(db, 'organizations', organizationId, 'members', assigneeId);
                batch.update(memberRef, { points: increment(bonusPoints) });
            });
            const fromUserDoc = await getDoc(doc(db, 'users', currentUserId));
            const fromUserData = fromUserDoc.data() as GlobalUserProfile;
            const activityRef = doc(collection(db, 'organizations', organizationId, 'activityFeed'));
            batch.set(activityRef, {
                organizationId: organizationId,
                timestamp: new Date(),
                type: 'rating',
                userId: currentUserId,
                userName: fromUserData.name,
                userAvatar: fromUserData.avatar,
                details: {
                    recipientIds: task.assigneeIds,
                    taskId: taskId,
                    taskTitle: task.title,
                    rating: rating,
                }
            });
        }
        
        await batch.commit();
        return { success: true, bonusPoints };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function transferPoints(organizationId: string, fromUserId: string, toUserId: string, amount: number, message: string, fromUserName: string) {
    if (fromUserId === toUserId) {
        return { error: 'Je kunt geen punten aan jezelf geven.' };
    }
    if (amount <= 0) {
        return { error: 'Je moet een positief aantal punten geven.' };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const fromMemberRef = doc(db, 'organizations', organizationId, 'members', fromUserId);
            const toMemberRef = doc(db, 'organizations', organizationId, 'members', toUserId);

            const fromMemberDoc = await transaction.get(fromMemberRef);

            if (!fromMemberDoc.exists()) {
                throw new Error("Verzender niet gevonden in deze organisatie.");
            }
            
            const fromMemberData = fromMemberDoc.data() as OrganizationMember;

            if ((fromMemberData.points || 0) < amount) {
                throw new Error("Je hebt niet genoeg punten om te geven.");
            }

            transaction.update(fromMemberRef, { points: increment(-amount) });
            transaction.update(toMemberRef, { points: increment(amount) });
        });

        const notificationMessage = `${fromUserName} heeft je ${amount} punten gegeven! ${message ? `Bericht: "${message}"` : ''}`;
        
        await createNotification(toUserId, notificationMessage, null, organizationId, 'system', { eventType: 'gamification' });

        return { success: true, amount };
    } catch (error: any) {
        console.error("Error transferring points:", error);
        return { error: error.message };
    }
}

export async function getPublicActivityFeed(organizationId: string): Promise<{ feed?: ActivityFeedItem[], error?: string }> {
    try {
        const q = query(
            collection(db, 'organizations', organizationId, 'activityFeed'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        const snapshot = await getDocs(q);
        const feed = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityFeedItem;
        });
        return { feed };
    } catch(e: any) {
        return { error: e.message };
    }
}

export async function checkAndGrantTeamAchievements(teamId: string, organizationId: string) {
    try {
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);
        if (!teamDoc.exists()) return;

        const teamData = teamDoc.data() as Team;
        const memberIds = teamData.memberIds;
        if (memberIds.length === 0) return;

        // --- Check for "TEAM_EFFORT" achievement ---
        const teamTasksQuery = query(
            collection(db, 'tasks'),
            where('organizationId', '==', organizationId),
            where('teamId', '==', teamId),
            where('status', '==', 'Voltooid')
        );
        const teamTasksSnapshot = await getDocs(teamTasksQuery);
        const completedTasksCount = teamTasksSnapshot.size;

        if (completedTasksCount >= 50) {
            const batch = writeBatch(db);
            const achievementId = ACHIEVEMENTS.TEAM_EFFORT.id;
            
            for (const memberId of memberIds) {
                const memberRef = doc(db, 'organizations', organizationId, 'members', memberId);
                const memberDoc = await getDoc(memberRef);

                if (memberDoc.exists() && !memberDoc.data().achievements?.includes(achievementId)) {
                     batch.update(memberRef, { achievements: arrayUnion(achievementId) });
                    
                    const notificationMessage = `Jullie team (${teamData.name}) is een geoliede machine! Prestatie ontgrendeld: "${ACHIEVEMENTS.TEAM_EFFORT.name}".`;
                    const notificationRef = doc(collection(db, 'notifications'));
                    batch.set(notificationRef, {
                        userId: memberId,
                        message: notificationMessage,
                        read: false,
                        createdAt: new Date(),
                        organizationId: organizationId,
                        eventType: 'gamification',
                    });
                }
            }

            await batch.commit();
        }
        
        // --- Placeholder for other team achievements like PROJECT_DOMINATORS ---

    } catch (e: any) {
        console.error(`Error checking team achievements for team ${teamId}:`, e);
    }
}

export { grantAchievements };
