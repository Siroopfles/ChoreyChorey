
'use server';

import { db } from '@/lib/core/firebase';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, arrayRemove, getDoc, deleteField, deleteDoc } from 'firebase/firestore';
import type { User, Organization } from '@/lib/types';

export async function updateOrganization(organizationId: string, userId: string, data: Partial<Pick<Organization, 'name' | 'settings'>>): Promise<{ data: { success: boolean } | null; error: string | null }> {
    // Permission checks are now handled in the UI layer before this action is called,
    // as the action itself is too generic to know which specific permission is required for the partial update.
    try {
        const orgRef = doc(db, 'organizations', organizationId);
        await updateDoc(orgRef, data);
        return { data: { success: true }, error: null };
    } catch (error: any) {
        console.error("Error updating organization:", error);
        return { data: null, error: error.message };
    }
}
