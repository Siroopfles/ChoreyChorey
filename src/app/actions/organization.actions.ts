
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, arrayUnion, arrayRemove, runTransaction, getDoc, setDoc, deleteDoc, deleteField } from 'firebase/firestore';
import type { User, Organization, Invite, RoleName, SavedFilter, Filters } from '@/lib/types';


export async function createOrganizationInvite(organizationId: string, inviterId: string, organizationName: string) {
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

export async function updateUserRoleInOrganization(organizationId: string, targetUserId: string, newRole: RoleName, currentUserId: string) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const orgData = orgDoc.data() as Organization;
        const currentUserRole = (orgData.members || {})[currentUserId]?.role;

        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
            throw new Error("Je hebt geen permissie om rollen aan te passen.");
        }
        if (orgData.ownerId === targetUserId) {
            throw new Error("De rol van de eigenaar kan niet worden gewijzigd.");
        }
        if (orgData.ownerId === currentUserId && newRole !== 'Owner' && targetUserId === currentUserId) {
             throw new Error("De eigenaar kan zijn eigen rol niet verlagen.");
        }

        const memberPath = `members.${targetUserId}.role`;
        await updateDoc(orgRef, { [memberPath]: newRole });

        return { success: true };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { error: error.message };
    }
}

export async function updateOrganization(organizationId: string, userId: string, data: Partial<Pick<Organization, 'name' | 'settings'>>) {
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        
        if (!orgDoc.exists()) {
             throw new Error("Organisatie niet gevonden.");
        }
        
        const orgData = orgDoc.data() as Organization;
        const member = orgData.members?.[userId];
        const isOwnerOrAdmin = member?.role === 'Owner' || member?.role === 'Admin';


        if (!isOwnerOrAdmin) {
            throw new Error("Alleen een Eigenaar of Beheerder kan deze organisatie bijwerken.");
        }

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

        const userData = userDoc.data() as User;
        const newOrgIds = userData.organizationIds?.filter(id => id !== organizationId) || [];
        
        const userUpdateData: any = {
             organizationIds: arrayRemove(organizationId)
        };

        if (userData.currentOrganizationId === organizationId) {
            userUpdateData.currentOrganizationId = newOrgIds.length > 0 ? newOrgIds[0] : null;
        }
        
        const memberPath = `members.${userId}`;
        const orgUpdateData = { [memberPath]: deleteField() };

        await updateDoc(userRef, userUpdateData);
        await updateDoc(orgRef, orgUpdateData);

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
        const collectionsToDelete = ['teams', 'tasks', 'taskTemplates', 'invites'];
        for (const coll of collectionsToDelete) {
            const q = query(collection(db, coll), where('organizationId', '==', organizationId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        // Update users who are members
        const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data() as User;
            const newOrgIds = userData.organizationIds?.filter(id => id !== organizationId) || [];
            const updateData: any = { organizationIds: arrayRemove(organizationId) };
            if (userData.currentOrganizationId === organizationId) {
                updateData.currentOrganizationId = newOrgIds.length > 0 ? newOrgIds[0] : null;
            }
            batch.update(userDoc.ref, updateData);
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
    if (fromUserId === toUserId) {
        return { error: "Je kunt geen taken naar dezelfde gebruiker toewijzen." };
    }
    
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error("Organisatie niet gevonden.");
        
        const orgData = orgDoc.data() as Organization;
        const currentUserRole = (orgData.members || {})[currentUserId]?.role;

        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
            throw new Error("Je hebt geen permissie om taken opnieuw toe te wijzen.");
        }
        
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
        const usersRef = collection(db, 'users');
        const fromUserDoc = await getDoc(doc(usersRef, fromUserId));
        const toUserDoc = await getDoc(doc(usersRef, toUserId));
        const currentUserDoc = await getDoc(doc(usersRef, currentUserId));

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
      const memberRole = (orgData.members || {})[userId]?.role;

      if (filterToDelete && filterToDelete.creatorId !== userId && memberRole !== 'Owner' && memberRole !== 'Admin') {
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
