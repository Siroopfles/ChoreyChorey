

'use server';

import { db } from '@/lib/firebase';
import { doc, writeBatch, arrayUnion, getDoc, query, collection, getDocs, where, updateDoc } from 'firebase/firestore';
import type { Project, Team } from '@/lib/types';
import { ACHIEVEMENTS, PERMISSIONS } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { checkAndGrantTeamAchievements } from './gamification.actions';

export async function completeProject(projectId: string, organizationId: string, currentUserId: string) {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_PROJECTS)) {
        return { error: "Je hebt geen permissie om een project te voltooien." };
    }

    try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) throw new Error("Project niet gevonden.");
        
        const projectData = projectDoc.data() as Project;
        const teamIds = projectData.teamIds || [];
        if (teamIds.length === 0) {
             return { success: true, message: "Project voltooid, maar er waren geen teams toegewezen om een badge aan uit te reiken." };
        }
        
        const teamsQuery = query(collection(db, 'teams'), where('__name__', 'in', teamIds));
        const teamsSnapshot = await getDocs(teamsQuery);
        const memberIds = new Set<string>();
        teamsSnapshot.docs.forEach(doc => {
            const teamData = doc.data() as Team;
            teamData.memberIds.forEach(id => memberIds.add(id));
        });

        const uniqueMemberIds = Array.from(memberIds);

        if (uniqueMemberIds.length === 0) {
            return { success: true, message: "Project voltooid, maar er waren geen leden in de toegewezen teams om een badge aan uit te reiken." };
        }

        const batch = writeBatch(db);
        const achievementId = ACHIEVEMENTS.PROJECT_COMPLETED.id;
        const notificationMessage = `Project '${projectData.name}' is voltooid! Je hebt de prestatie "${ACHIEVEMENTS.PROJECT_COMPLETED.name}" ontgrendeld.`;

        uniqueMemberIds.forEach(memberId => {
            const memberRef = doc(db, 'organizations', organizationId, 'members', memberId);
            batch.update(memberRef, { achievements: arrayUnion(achievementId) });

            const notificationRef = doc(collection(db, 'notifications'));
            batch.set(notificationRef, {
                userId: memberId,
                message: notificationMessage,
                read: false,
                createdAt: new Date(),
                organizationId: organizationId,
                eventType: 'gamification'
            });
        });
        
        await batch.commit();

        // After granting individual project completion badges, check for team-level achievements.
        for (const teamId of teamIds) {
            checkAndGrantTeamAchievements(teamId, organizationId).catch(console.error);
        }

        return { success: true, message: `${uniqueMemberIds.length} lid / leden hebben een prestatie ontvangen.` };

    } catch (error: any) {
        console.error("Error completing project:", error);
        return { error: error.message };
    }
}

export async function toggleProjectPin(projectId: string, organizationId: string, userId: string, isPinned: boolean) {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.PIN_ITEMS)) {
        return { error: "Je hebt geen permissie om dit project vast te pinnen." };
    }
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { pinned: isPinned });
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling project pin:", error);
        return { error: error.message };
    }
}
