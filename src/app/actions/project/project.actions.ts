

'use server';

import { db } from '@/lib/core/firebase';
import { doc, writeBatch, arrayUnion, getDoc, query, collection, getDocs, where, updateDoc, deleteField } from 'firebase/firestore';
import { ACHIEVEMENTS } from '@/lib/types/gamification';
import { PERMISSIONS } from '@/lib/types/permissions';
import { hasPermission } from '@/lib/core/permissions';
import { checkAndGrantTeamAchievements } from '@/app/actions/core/gamification.actions';
import type { Project } from '@/lib/types/projects';
import type { Team } from '@/lib/types/organizations';
import type { RoleName } from '@/lib/types/permissions';

export async function completeProject(projectId: string, organizationId: string, currentUserId: string): Promise<{ data: { success: boolean, message: string } | null; error: string | null; }> {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_PROJECTS, { projectId })) {
        return { data: null, error: "Je hebt geen permissie om een project te voltooien." };
    }

    try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) throw new Error("Project niet gevonden.");
        
        const projectData = projectDoc.data() as Project;
        const teamIds = projectData.teamIds || [];
        if (teamIds.length === 0) {
             return { data: { success: true, message: "Project voltooid, maar er waren geen teams toegewezen om een badge aan uit te reiken." }, error: null };
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
            return { data: { success: true, message: "Project voltooid, maar er waren geen leden in de toegewezen teams om een badge aan uit te reiken." }, error: null };
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

        return { data: { success: true, message: `${uniqueMemberIds.length} lid / leden hebben een prestatie ontvangen.` }, error: null };

    } catch (error: any) {
        console.error("Error completing project:", error);
        return { data: null, error: error.message };
    }
}

export async function toggleProjectPin(projectId: string, organizationId: string, userId: string, isPinned: boolean): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.PIN_ITEMS)) {
        return { data: null, error: "Je hebt geen permissie om dit project vast te pinnen." };
    }
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { pinned: isPinned });
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error toggling project pin:", error);
        return { data: null, error: error.message };
    }
}

export async function updateProjectRole(projectId: string, organizationId: string, targetUserId: string, role: RoleName | 'inherit', currentUserId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_PROJECT_ROLES, { projectId })) {
        return { data: null, error: "Je hebt geen permissie om rollen binnen dit project aan te passen." };
    }
    try {
        const projectRef = doc(db, 'projects', projectId);
        const updateData = role === 'inherit' 
            ? { [`projectRoles.${targetUserId}`]: deleteField() }
            : { [`projectRoles.${targetUserId}`]: role };
        
        await updateDoc(projectRef, updateData);
        
        return { data: { success: true }, error: null };

    } catch (error: any) {
        console.error("Error updating project role:", error);
        return { data: null, error: error.message };
    }
}


export async function setProjectPublicStatus(
  projectId: string, 
  organizationId: string, 
  userId: string, 
  isPublic: boolean
): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_PROJECTS)) {
        return { data: null, error: "U heeft geen permissie om de publieke status van dit project te wijzigen." };
    }
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { isPublic });
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error setting project public status:", error);
        return { data: null, error: error.message };
    }
}
