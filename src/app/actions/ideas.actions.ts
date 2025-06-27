
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
import type { IdeaFormValues, IdeaStatus } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import { getDocs, query, where } from 'firebase/firestore';

// Helper to check permissions
async function hasPermission(userId: string, organizationId: string, permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]): Promise<boolean> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) return false;
    
    const orgData = orgDoc.data();
    const roleId = orgData.members?.[userId]?.role;
    if (!roleId) return false;

    const allRoles = { ...orgData.settings?.customization?.customRoles, ...orgData.settings?.defaultRoles }; // This needs fixing, no defaultRoles
    const role = allRoles[roleId];
    return role?.permissions?.includes(permission) ?? false;
}


export async function createIdea(organizationId: string, creatorId: string, data: IdeaFormValues) {
  try {
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
  // A simple permission check for now. A more robust system would use the AuthProvider.
  const usersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
  if (usersSnapshot.empty) {
     return { error: "Gebruiker niet gevonden." };
  }

  const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
  if (!orgDoc.exists()) {
    return { error: "Organisatie niet gevonden." };
  }
  const orgData = orgDoc.data();
  const userRole = orgData.members?.[userId]?.role;
  
  if (userRole !== 'Owner' && userRole !== 'Admin') {
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

