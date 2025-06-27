
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import type { IdeaFormValues, IdeaStatus, Organization } from '@/lib/types';
import { PERMISSIONS, DEFAULT_ROLES } from '@/lib/types';

async function checkIdeasEnabled(organizationId: string): Promise<boolean> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) return false;
    const orgData = orgDoc.data() as Organization;
    return orgData.settings?.features?.ideas !== false;
}

// Helper to check permissions
async function hasPermission(userId: string, organizationId: string, permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]): Promise<boolean> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) return false;
    
    const orgData = orgDoc.data() as Organization;
    const roleId = orgData.members?.[userId]?.role;
    if (!roleId) return false;

    const allRoles = { ...DEFAULT_ROLES, ...(orgData.settings?.customization?.customRoles || {}) };
    const role = allRoles[roleId];
    return role?.permissions?.includes(permission) ?? false;
}

export async function createIdea(organizationId: string, creatorId: string, data: IdeaFormValues) {
  try {
    if (!await checkIdeasEnabled(organizationId)) {
      return { error: 'De ideeënbus is uitgeschakeld voor deze organisatie.' };
    }
    await addDoc(collection(db, 'ideas'), {
      ...data,
      organizationId,
      creatorId,
      createdAt: new Date(),
      status: 'new',
      upvotes: [creatorId], // Creator automatically upvotes their own idea
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error creating idea:", error);
    return { error: error.message };
  }
}

export async function toggleIdeaUpvote(ideaId: string, userId: string) {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaDocCheck = await getDoc(ideaRef);
    if (!ideaDocCheck.exists()) throw new Error("Idee niet gevonden.");
    
    if (!await checkIdeasEnabled(ideaDocCheck.data().organizationId)) {
        return { error: 'De ideeënbus is uitgeschakeld voor deze organisatie.' };
    }
    
    await runTransaction(db, async (transaction) => {
      const ideaDoc = await transaction.get(ideaRef);
      if (!ideaDoc.exists()) {
        throw new Error("Idee niet gevonden.");
      }
      const ideaData = ideaDoc.data();
      const upvotes = ideaData.upvotes || [];
      if (upvotes.includes(userId)) {
        transaction.update(ideaRef, { upvotes: arrayRemove(userId) });
      } else {
        transaction.update(ideaRef, { upvotes: arrayUnion(userId) });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling upvote:", error);
    return { error: error.message };
  }
}

export async function updateIdeaStatus(ideaId: string, status: IdeaStatus, userId: string, organizationId: string) {
  if (!await checkIdeasEnabled(organizationId)) {
    return { error: 'De ideeënbus is uitgeschakeld voor deze organisatie.' };
  }
  
  const canManage = await hasPermission(userId, organizationId, PERMISSIONS.MANAGE_IDEAS);
  if (!canManage) {
    return { error: "U heeft geen permissie om de status aan te passen." };
  }
  
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    await updateDoc(ideaRef, { status: status });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating idea status:", error);
    return { error: error.message };
  }
}
