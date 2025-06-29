
'use server';

import { db } from '@/lib/firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import type { Organization, SavedFilter, Filters } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

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
