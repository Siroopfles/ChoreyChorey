
'use server';

import { db } from '@/lib/core/firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion, arrayRemove, getDoc, writeBatch, deleteField, deleteDoc } from 'firebase/firestore';
import { hasPermission } from '@/lib/core/permissions';
import { PERMISSIONS, type RoleName } from '@/lib/types/permissions';
import { ROLE_OWNER } from '@/lib/core/constants';
import { addHistoryEntry } from '@/lib/utils/history-utils';
import type { UserStatus, User } from '@/lib/types/auth';
import type { OrganizationMember, Organization } from '@/lib/types/organizations';
import type { Permission } from '@/lib/types/permissions';
import { generateAvatar } from '@/ai/flows/generative-ai/generate-avatar-flow';


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

export async function leaveOrganization(organizationId: string, userId: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
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
        
        batch.update(orgRef, {
            [`members.${userId}`]: deleteField()
        });

        batch.update(userRef, {
            organizationIds: arrayRemove(organizationId)
        });

        await batch.commit();

        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error leaving organization:", error);
        return { data: null, error: error.message };
    }
}

export async function deleteOrganization(organizationId: string, userId: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
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
            batch.update(userDoc.ref, {
                organizationIds: arrayRemove(organizationId),
                currentOrganizationId: null // Reset current org
            });
        });

        // Delete the organization itself
        batch.delete(orgRef);
        
        await batch.commit();

        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error deleting organization:", error);
        return { data: null, error: error.message };
    }
}

export async function endorseSkill(organizationId: string, userId: string, skill: string, endorserId: string) {
  try {
    const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
    
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      throw new Error('Gebruiker niet gevonden in deze organisatie.');
    }

    const memberData = memberDoc.data() as OrganizationMember;
    const endorsements = memberData.endorsements || {};
    const skillEndorsements = endorsements[skill] || [];
    
    let updatedEndorsements;

    if (skillEndorsements.includes(endorserId)) {
        // User already endorsed, so we remove it (toggle off)
        updatedEndorsements = {
            ...endorsements,
            [skill]: skillEndorsements.filter(id => id !== endorserId)
        };
    } else {
        // User has not endorsed yet, so we add it (toggle on)
        updatedEndorsements = {
            ...endorsements,
            [skill]: [...skillEndorsements, endorserId]
        };
    }
    
    await updateDoc(doc(db, 'organizations', organizationId), { [`members.${userId}.endorsements`]: updatedEndorsements });

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error endorsing skill:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het onderschrijven van de vaardigheid.' };
  }
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<{ success: boolean, error: string | null }> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function generateAvatarAction(userId: string, name: string): Promise<{ avatarUrl?: string, error?: string }> {
    try {
        const { avatarUrl } = await generateAvatar({ userId, name });
        return { avatarUrl };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function purchaseCosmeticItem(
  organizationId: string,
  userId: string,
  cost: number,
  updates: { [key: string]: string }
): Promise<{ success: boolean; error: string | null }> {
  const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
  const userRef = doc(db, 'users', userId);
  
  const batch = writeBatch(db);

  try {
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
        throw new Error("Gebruiker niet gevonden in organisatie.");
    }
    const currentPoints = memberDoc.data().points || 0;
    if (currentPoints < cost) {
        throw new Error("Niet genoeg punten.");
    }
    const newPoints = currentPoints - cost;
    
    const cosmeticUpdates: { [key: string]: any } = {};
    for (const key in updates) {
      cosmeticUpdates[`cosmetic.${key}`] = updates[key];
    }
    
    // Update points in the organization member subcollection
    batch.update(memberRef, { points: newPoints });
    // Update cosmetic settings on the root user document
    batch.update(userRef, cosmeticUpdates);

    await batch.commit();

    return { success: true, error: null };
  } catch (e: any) {
    console.error('Error purchasing item:', e);
    return { success: false, error: 'Aankoop mislukt' };
  }
}
