''''use server';

import { firestore } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function endorseSkill(organizationId: string, userId: string, skill: string, endorserId: string) {
  try {
    const userRef = doc(firestore, `organizations/${organizationId}/members`, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { error: 'Gebruiker niet gevonden.' };
    }

    const userData = userDoc.data();
    const endorsements = userData.endorsements || {};
    const skillEndorsements = endorsements[skill] || [];

    if (skillEndorsements.includes(endorserId)) {
      return { error: 'Je hebt deze vaardigheid al onderschreven.' };
    }

    await updateDoc(userRef, {
      [`endorsements.${skill}`]: arrayUnion(endorserId),
    });

    revalidatePath(`/dashboard/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error endorsing skill:', error);
    return { error: 'Er is een fout opgetreden bij het onderschrijven van de vaardigheid.' };
  }
}
'''