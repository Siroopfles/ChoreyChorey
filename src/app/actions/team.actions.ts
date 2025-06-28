
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

export async function manageTeam(
  action: 'create' | 'update' | 'delete',
  organizationId: string,
  currentUserId: string,
  payload: {
    teamId?: string;
    name?: string;
  }
) {
    if (!await hasPermission(currentUserId, organizationId, PERMISSIONS.MANAGE_TEAMS)) {
        return { error: "Je hebt geen permissie om teams te beheren." };
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
      return { success: true };
    }

    if (action === 'update' && teamId && name) {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { name });
      return { success: true };
    }

    if (action === 'delete' && teamId) {
      const teamRef = doc(db, 'teams', teamId);
      await deleteDoc(teamRef);
      return { success: true };
    }

    throw new Error('Invalid action or payload for managing team.');
  } catch (error: any) {
    return { error: error.message };
  }
}
