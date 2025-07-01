
'use server';

import { db } from '@/lib/core/firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion, arrayRemove, getDoc, writeBatch, deleteField } from 'firebase/firestore';
import { hasPermission } from '@/lib/core/permissions';
import { PERMISSIONS, type RoleName } from '@/lib/types/permissions';
import { ROLE_OWNER } from '@/lib/core/constants';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import type { UserStatus } from '@/lib/types/auth';
import type { OrganizationMember } from '@/lib/types/organizations';
import type { Permission } from '@/lib/types/permissions';


export async function markOnboardingComplete(organizationId: string, userId: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
    try {
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
             // If member doesn't exist, create it. This can happen with guest invites.
             await updateDoc(doc(db, 'organizations', organizationId), {
                [`members.${userId}.hasCompletedOnboarding`]: true
            });
        } else {
            await updateDoc(memberRef, { hasCompletedOnboarding: true });
        }
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error marking onboarding as complete:", error);
        return { data: null, error: error.message };
    }
}

export async function updateUserRoleInOrganization(organizationId: string, targetUserId: string, newRole: RoleName, currentUserId: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_ROLES)) {
        return { data: null, error: "Je hebt geen permissie om rollen aan te passen." };
    }
    
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const orgData = orgDoc.data() as any;

        if (orgData.ownerId === targetUserId) {
            throw new Error("De rol van de eigenaar kan niet worden gewijzigd.");
        }
        if (orgData.ownerId === currentUserId && newRole !== ROLE_OWNER && targetUserId === currentUserId) {
             throw new Error("De eigenaar kan zijn eigen rol niet verlagen.");
        }

        await updateDoc(orgRef, {
            [`members.${targetUserId}.role`]: newRole
        });

        return { data: { success: true }, error: null };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { data: null, error: error.message };
    }
}

export async function reassignTasks(organizationId: string, fromUserId: string, toUserId: string, currentUserId: string): Promise<{ data: { success: boolean, message: string } | null; error: string | null; }> {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_ROLES)) {
        return { data: null, error: "Je hebt geen permissie om taken opnieuw toe te wijzen." };
    }
    
    if (fromUserId === toUserId) {
        return { data: null, error: "Je kunt geen taken naar dezelfde gebruiker toewijzen." };
    }
    
    try {
        const tasksQuery = query(
            collection(db, 'tasks'), 
            where('organizationId', '==', organizationId),
            where('assigneeIds', 'array-contains', fromUserId)
        );

        const tasksSnapshot = await getDocs(tasksQuery);
        
        if (tasksSnapshot.empty) {
            return { data: { success: true, message: "Geen taken gevonden om opnieuw toe te wijzen voor deze gebruiker." }, error: null };
        }

        const batch = writeBatch(db);
        const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));

        const fromUserName = fromUserDoc.data()?.name || 'Onbekende Gebruiker';
        const toUserName = toUserDoc.data()?.name || 'Onbekende Gebruiker';
        const currentUserName = currentUserDoc.data()?.name || 'Een Beheerder';
        
        tasksSnapshot.forEach(taskDoc => {
            const taskRef = doc(db, 'tasks', taskDoc.id);
            const historyEntry = addHistoryEntry(currentUserId, 'Taak opnieuw toegewezen', `Bulk-actie door ${currentUserName}: van ${fromUserName} naar ${toUserName}.`);
            
            const currentAssignees = taskDoc.data().assigneeIds || [];
            const newAssignees = [...new Set([...currentAssignees.filter((id: string) => id !== fromUserId), toUserId])];
            
            batch.update(taskRef, {
                assigneeIds: newAssignees,
                history: arrayUnion(historyEntry)
            });
        });

        await batch.commit();

        return { data: { success: true, message: `${tasksSnapshot.size} taken zijn opnieuw toegewezen van ${fromUserName} naar ${toUserName}.` }, error: null };

    } catch (error: any) {
        console.error("Error reassigning tasks:", error);
        return { data: null, error: error.message };
    }
}

export async function updateMemberProfile(organizationId: string, userId: string, data: Partial<Omit<OrganizationMember, 'id' | 'role' | 'points' | 'permissionOverrides'>>): Promise<{ data: { success: boolean } | null; error: string | null }> {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            updates[`members.${userId}.${key}`] = value;
        }

        await updateDoc(orgRef, updates);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error updating member profile:", error);
        return { data: null, error: error.message };
    }
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<{ data: { success: boolean } | null; error: string | null }> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            status: status
        });
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error updating user status:", error);
        return { data: null, error: error.message };
    }
}

export async function toggleMuteTask(organizationId: string, userId: string, taskId: string): Promise<{ data: { success: boolean, newState: 'muted' | 'unmuted' } | null; error: string | null }> {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("Gebruiker niet gevonden.");
        }
        const userData = userDoc.data() as any;
        const mutedTaskIds = userData.mutedTaskIds || [];
        const isMuted = mutedTaskIds.includes(taskId);

        await updateDoc(userRef, {
            mutedTaskIds: isMuted ? arrayRemove(taskId) : arrayUnion(taskId)
        });
        
        return { data: { success: true, newState: isMuted ? 'unmuted' : 'muted' }, error: null };
    } catch (error: any) {
        console.error("Error toggling task mute:", error);
        return { data: null, error: error.message };
    }
}

export async function updateMemberPermissions(
  organizationId: string,
  targetUserId: string,
  updates: { granted?: Permission[]; revoked?: Permission[] },
  currentUserId: string
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_MEMBER_PERMISSIONS)) {
    return { data: null, error: "Je hebt geen permissie om individuele permissies aan te passen." };
  }
  
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
    
    const orgData = orgDoc.data() as any;
    if (orgData.ownerId === targetUserId) {
        throw new Error("De permissies van de eigenaar kunnen niet worden overschreven.");
    }

    await updateDoc(orgRef, {
        [`members.${targetUserId}.permissionOverrides`]: updates
    });
    
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error("Error updating member permissions:", error);
    return { data: null, error: error.message };
  }
}
