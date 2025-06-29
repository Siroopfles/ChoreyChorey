
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, arrayRemove, getDoc, deleteField, deleteDoc } from 'firebase/firestore';
import type { User, Organization } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

export async function updateOrganization(organizationId: string, userId: string, data: Partial<Pick<Organization, 'name' | 'settings'>>): Promise<{ data: { success: boolean } | null; error: string | null }> {
    if (!await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_ORGANIZATION)) {
        return { data: null, error: "Alleen een Eigenaar of Beheerder kan deze organisatie bijwerken." };
    }
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        await updateDoc(orgRef, data);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error updating organization:", error);
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
            const userData = userDoc.data() as User;
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
