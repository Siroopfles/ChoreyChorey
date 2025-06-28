'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, arrayUnion, arrayRemove, runTransaction, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import type { User, Organization, Invite, RoleName, SavedFilter, Filters, Team, Project, Permission, OrganizationMember } from '@/lib/types';
import { ACHIEVEMENTS, PERMISSIONS } from '@/lib/types';
import { checkAndGrantTeamAchievements } from './gamification.actions';
import { hasPermission } from '@/lib/permissions';

export async function createOrganizationInvite(organizationId: string, inviterId: string, organizationName: string) {
    if (!await hasPermission(inviterId, organizationId, PERMISSIONS.MANAGE_MEMBERS)) {
        return { error: "Je hebt geen permissie om leden uit te nodigen." };
    }
    try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            organizationName,
            inviterId,
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { success: true, inviteId: newInviteRef.id };
    } catch (error: any) {
        console.error("Error creating invite:", error);
        return { error: error.message };
    }
}

export async function createProjectGuestInvite(organizationId: string, projectId: string, inviterId: string, organizationName: string) {
    if (!await hasPermission(inviterId, organizationId, PERMISSIONS.MANAGE_MEMBERS)) {
        return { error: "Je hebt geen permissie om gasten uit te nodigen." };
    }
     try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            organizationName,
            inviterId,
            projectId, // Add projectId to the invite
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { success: true, inviteId: newInviteRef.id };
    } catch (error: any) {
        console.error("Error creating guest invite:", error);
        return { error: error.message };
    }
}


export async function updateUserRoleInOrganization(organizationId: string, targetUserId: string, newRole: RoleName, currentUserId: string) {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_ROLES)) {
        return { error: "Je hebt geen permissie om rollen aan te passen." };
    }
    
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const orgData = orgDoc.data() as Organization;

        if (orgData.ownerId === targetUserId) {
            throw new Error("De rol van de eigenaar kan niet worden gewijzigd.");
        }
        if (orgData.ownerId === currentUserId && newRole !== 'Owner' && targetUserId === currentUserId) {
             throw new Error("De eigenaar kan zijn eigen rol niet verlagen.");
        }

        const memberRef = doc(db, 'organizations', organizationId, 'members', targetUserId);
        await updateDoc(memberRef, { role: newRole });

        return { success: true };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { error: error.message };
    }
}

export async function updateOrganization(organizationId: string, userId: string, data: Partial<Pick<Organization, 'name' | 'settings'>>) {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_ORGANIZATION)) {
        return { error: "Alleen een Eigenaar of Beheerder kan deze organisatie bijwerken." };
    }
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        await updateDoc(orgRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating organization:", error);
        return { error: error.message };
    }
}

export async function leaveOrganization(organizationId: string, userId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) {
            throw new Error("Organisatie niet gevonden.");
        }
        if (orgDoc.data().ownerId === userId) {
            throw new Error("De eigenaar kan de organisatie niet verlaten. Verwijder de organisatie of draag het eigendom over.");
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
             throw new Error("Gebruiker niet gevonden.");
        }

        const batch = writeBatch(db);
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        
        batch.delete(memberRef);
        batch.update(userRef, {
            organizationIds: arrayRemove(organizationId)
        });

        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Error leaving organization:", error);
        return { error: error.message };
    }
}

export async function deleteOrganization(organizationId: string, userId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);

        if (!orgDoc.exists() || orgDoc.data().ownerId !== userId) {
            throw new Error("Alleen de eigenaar kan deze organisatie verwijderen.");
        }

        const batch = writeBatch(db);

        // Delete associated collections
        const collectionsToDelete = ['projects', 'teams', 'tasks', 'taskTemplates', 'invites', 'personalGoals', 'teamChallenges', 'ideas', 'activityFeed', 'webhooks', 'apiKeys', 'members'];
        for (const coll of collectionsToDelete) {
            let collectionPath = coll;
            if (['members'].includes(coll)) {
                collectionPath = `organizations/${organizationId}/${coll}`;
            }

            const q = query(collection(db, collectionPath), where('organizationId', '==', organizationId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        // Update users who are members
        const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data() as User;
            batch.update(userDoc.ref, {
                organizationIds: arrayRemove(organizationId),
                currentOrganizationId: null // Reset current org
            });
        });

        // Delete the organization itself
        batch.delete(orgRef);
        
        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting organization:", error);
        return { error: error.message };
    }
}


export async function reassignTasks(organizationId: string, fromUserId: string, toUserId: string, currentUserId: string) {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_ROLES)) {
        return { error: "Je hebt geen permissie om taken opnieuw toe te wijzen." };
    }
    
    if (fromUserId === toUserId) {
        return { error: "Je kunt geen taken naar dezelfde gebruiker toewijzen." };
    }
    
    try {
        const tasksQuery = query(
            collection(db, 'tasks'), 
            where('organizationId', '==', organizationId),
            where('assigneeIds', 'array-contains', fromUserId)
        );

        const tasksSnapshot = await getDocs(tasksQuery);
        
        if (tasksSnapshot.empty) {
            return { success: true, message: "Geen taken gevonden om opnieuw toe te wijzen voor deze gebruiker." };
        }

        const batch = writeBatch(db);
        const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));

        const fromUserName = fromUserDoc.data()?.name || 'Onbekende Gebruiker';
        const toUserName = toUserDoc.data()?.name || 'Onbekende Gebruiker';
        const currentUserName = currentUserDoc.data()?.name || 'Een Beheerder';
        
        const addHistoryEntryForReassignment = () => ({
            id: crypto.randomUUID(),
            userId: currentUserId,
            timestamp: new Date(),
            action: 'Taak opnieuw toegewezen',
            details: `Bulk-actie door ${currentUserName}: van ${fromUserName} naar ${toUserName}.`,
        });

        tasksSnapshot.forEach(taskDoc => {
            const taskRef = doc(db, 'tasks', taskDoc.id);
            const historyEntry = addHistoryEntryForReassignment();
            
            const currentAssignees = taskDoc.data().assigneeIds || [];
            const newAssignees = [...new Set([...currentAssignees.filter((id: string) => id !== fromUserId), toUserId])];
            
            batch.update(taskRef, {
                assigneeIds: newAssignees,
                history: arrayUnion(historyEntry)
            });
        });

        await batch.commit();

        return { success: true, message: `${tasksSnapshot.size} taken zijn opnieuw toegewezen van ${fromUserName} naar ${toUserName}.` };

    } catch (error: any) {
        console.error("Error reassigning tasks:", error);
        return { error: error.message };
    }
}

export async function manageSavedFilter(
  organizationId: string,
  userId: string,
  action: 'save' | 'delete',
  payload: { name?: string; filters?: Filters; filterId?: string }
) {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
      throw new Error('Organisatie niet gevonden.');
    }
    const orgData = orgDoc.data() as Organization;
    const currentFilters = orgData.settings?.savedFilters || [];
    let newFiltersList: SavedFilter[] = [];

    if (action === 'save') {
      if (!payload.name || !payload.filters) {
        throw new Error('Naam en filters zijn vereist om op te slaan.');
      }
      const newFilter: SavedFilter = {
        id: crypto.randomUUID(),
        name: payload.name,
        creatorId: userId,
        filters: payload.filters,
      };
      newFiltersList = [...currentFilters, newFilter];
    } else if (action === 'delete') {
      if (!payload.filterId) {
        throw new Error('Filter ID is vereist om te verwijderen.');
      }
      const filterToDelete = currentFilters.find(f => f.id === payload.filterId);
      
      const canDelete = filterToDelete && (filterToDelete.creatorId === userId || await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_ORGANIZATION));

      if (!canDelete) {
          throw new Error("Je hebt geen permissie om dit filter te verwijderen.");
      }
      newFiltersList = currentFilters.filter(f => f.id !== payload.filterId);
    } else {
      throw new Error('Ongeldige actie.');
    }

    await updateDoc(orgRef, { 'settings.savedFilters': newFiltersList });
    return { success: true };
  } catch (error: any) {
    console.error('Error managing saved filter:', error);
    return { error: error.message };
  }
}

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


// --- Organization Member Profile Actions ---
export async function updateMemberProfile(organizationId: string, userId: string, data: Partial<Omit<OrganizationMember, 'id' | 'role'>>) {
    try {
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        await updateDoc(memberRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating member profile:", error);
        return { error: error.message };
    }
}

export async function purchaseTheme(organizationId: string, userId: string, color: string, cost: number) {
    if (cost < 0) {
        return { error: 'Kosten kunnen niet negatief zijn.' };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
            const memberDoc = await transaction.get(memberRef);

            if (!memberDoc.exists()) {
                throw new Error("Lid niet gevonden.");
            }
            
            const memberData = memberDoc.data() as OrganizationMember;

            if ((memberData.points || 0) < cost) {
                throw new Error("Je hebt niet genoeg punten voor dit thema.");
            }

            transaction.update(memberRef, { 
                points: increment(-cost),
                'cosmetic.primaryColor': color 
            });
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error purchasing theme:", error);
        return { error: error.message };
    }
}

export async function toggleSkillEndorsement(organizationId: string, targetUserId: string, skill: string, endorserId: string) {
    if (targetUserId === endorserId) {
        return { error: 'Je kunt je eigen vaardigheden niet onderschrijven.' };
    }
    
    try {
        const targetMemberRef = doc(db, 'organizations', organizationId, 'members', targetUserId);
        
        await runTransaction(db, async (transaction) => {
            const targetMemberDoc = await transaction.get(targetMemberRef);
            if (!targetMemberDoc.exists()) {
                throw new Error("Doelgebruiker niet gevonden.");
            }

            const targetMemberData = targetMemberDoc.data() as OrganizationMember;
            const endorsements = targetMemberData.endorsements || {};
            const skillEndorsers = endorsements[skill] || [];

            const fieldPath = `endorsements.${skill}`;
            if (skillEndorsers.includes(endorserId)) {
                // User has already endorsed, so retract endorsement
                transaction.update(targetMemberRef, { [fieldPath]: arrayRemove(endorserId) });
            } else {
                // User has not endorsed, so add endorsement
                transaction.update(targetMemberRef, { [fieldPath]: arrayUnion(endorserId) });
            }
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling skill endorsement:", error);
        return { error: error.message };
    }
}
