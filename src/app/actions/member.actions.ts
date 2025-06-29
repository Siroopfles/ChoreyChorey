

'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion, arrayRemove, getDoc, writeBatch } from 'firebase/firestore';
import type { RoleName, UserStatus, OrganizationMember } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';


export async function markOnboardingComplete(organizationId: string, userId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        await updateDoc(orgRef, {
            [`members.${userId}.hasCompletedOnboarding`]: true
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error marking onboarding as complete:", error);
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
        
        const orgData = orgDoc.data() as any;

        if (orgData.ownerId === targetUserId) {
            throw new Error("De rol van de eigenaar kan niet worden gewijzigd.");
        }
        if (orgData.ownerId === currentUserId && newRole !== 'Owner' && targetUserId === currentUserId) {
             throw new Error("De eigenaar kan zijn eigen rol niet verlagen.");
        }

        await updateDoc(orgRef, {
            [`members.${targetUserId}.role`]: newRole
        });

        return { success: true };

    } catch (error: any) {
        console.error("Error updating user role:", error);
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

export async function updateMemberProfile(organizationId: string, userId: string, data: Partial<Omit<OrganizationMember, 'id' | 'role' | 'points'>>) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            updates[`members.${userId}.${key}`] = value;
        }

        await updateDoc(orgRef, updates);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating member profile:", error);
        return { error: error.message };
    }
}

export async function updateUserStatus(organizationId: string, userId: string, status: UserStatus) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
             await updateDoc(orgRef, {
                [`members.${userId}`]: { status }
            });
        } else {
             await updateDoc(orgRef, {
                [`members.${userId}.status`]: status
            });
        }
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user status:", error);
        return { error: error.message };
    }
}

export async function toggleMuteTask(organizationId: string, userId: string, taskId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) {
            throw new Error("Organisatie niet gevonden.");
        }
        const orgData = orgDoc.data() as any;
        const memberData = orgData.members?.[userId];
        const mutedTaskIds = memberData?.mutedTaskIds || [];
        const isMuted = mutedTaskIds.includes(taskId);

        await updateDoc(orgRef, {
            [`members.${userId}.mutedTaskIds`]: isMuted ? arrayRemove(taskId) : arrayUnion(taskId)
        });
        
        return { success: true, newState: isMuted ? 'unmuted' : 'muted' };
    } catch (error: any) {
        console.error("Error toggling task mute:", error);
        return { error: error.message };
    }
}
