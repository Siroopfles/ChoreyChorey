
'use server';

import { db } from '@/lib/core/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';

export async function manageTeam(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  currentUserId: string,
  payload: {
    teamId?: string;
    name?: string;
  }
): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_TEAMS)) {
        return { data: null, error: "Je hebt geen permissie om teams te beheren." };
    }

  try {
    const { teamId, name } = payload;
    if (!organizationId) {
        throw new Error('Organization ID is required.');
    }

    if (action === 'create' && name) {
      const newTeam: Omit<Team, 'id'> = {
        name,
        organizationId,
        memberIds: [],
      };
      await addDoc(collection(db, 'teams'), newTeam);
      return { data: { success: true }, error: null };
    }

    if (action === 'update' && teamId && name) {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { name });
      return { data: { success: true }, error: null };
    }

    if (action === 'delete' && teamId) {
      const teamRef = doc(db, 'teams', teamId);
      await deleteDoc(teamRef);
      return { data: { success: true }, error: null };
    }

    throw new Error('Invalid action or payload for managing team.');
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
