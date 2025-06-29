
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch, increment, getDoc } from 'firebase/firestore';
import type { PersonalGoal, PersonalGoalFormValues, TeamChallengeFormValues, Milestone, Organization } from '@/lib/types';

async function checkGoalsEnabled(organizationId: string): Promise<boolean> {
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
        console.error(`Organization ${organizationId} not found.`);
        return false;
    }
    const orgData = orgDoc.data() as Organization;
    return orgData.settings?.features?.goals !== false;
}

// Personal Goals
export async function addPersonalGoal(organizationId: string, userId: string, goalData: PersonalGoalFormValues): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    if (!await checkGoalsEnabled(organizationId)) {
      return { data: null, error: 'Doelen zijn uitgeschakeld voor deze organisatie.' };
    }
    const newGoal: Omit<PersonalGoal, 'id'> = {
      userId,
      organizationId,
      title: goalData.title,
      description: goalData.description || '',
      targetDate: goalData.targetDate || undefined,
      status: 'In Progress',
      milestones: goalData.milestones?.map(m => ({...m, id: crypto.randomUUID(), completed: false})) || [],
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'personalGoals'), newGoal);
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function updatePersonalGoal(goalId: string, goalData: PersonalGoalFormValues, existingMilestones: Milestone[]): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const goalRef = doc(db, 'personalGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    if (!goalDoc.exists()) return { data: null, error: 'Doel niet gevonden' };
    if (!await checkGoalsEnabled(goalDoc.data().organizationId)) {
        return { data: null, error: 'Doelen zijn uitgeschakeld voor deze organisatie.' };
    }

    const updatedMilestones = goalData.milestones?.map((ms, index) => {
        const existingMilestone = existingMilestones.find(ems => ems.text === ms.text);
        return {
            id: existingMilestone?.id || existingMilestones[index]?.id || crypto.randomUUID(),
            text: ms.text,
            completed: existingMilestone?.completed || existingMilestones[index]?.completed || false
        }
    }) || [];

    const cleanGoalData = {
        title: goalData.title,
        description: goalData.description,
        targetDate: goalData.targetDate,
        milestones: updatedMilestones
    };

    await updateDoc(goalRef, cleanGoalData as any);
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function deletePersonalGoal(goalId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const goalRef = doc(db, 'personalGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    if (!goalDoc.exists()) return { data: { success: true }, error: null };
    if (!await checkGoalsEnabled(goalDoc.data().organizationId)) {
        return { data: null, error: 'Doelen zijn uitgeschakeld voor deze organisatie.' };
    }

    await deleteDoc(goalRef);
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function toggleMilestoneCompletion(goalId: string, milestoneId: string, milestones: Milestone[]): Promise<{ data: { success: boolean, allCompleted: boolean } | null; error: string | null; }> {
  try {
    const goalRef = doc(db, 'personalGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    if (!goalDoc.exists()) return { data: null, error: 'Doel niet gevonden' };
    if (!await checkGoalsEnabled(goalDoc.data().organizationId)) {
        return { data: null, error: 'Doelen zijn uitgeschakeld voor deze organisatie.' };
    }

    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const allCompleted = updatedMilestones.every(m => m.completed);
    
    await updateDoc(goalRef, {
      milestones: updatedMilestones,
      status: allCompleted ? 'Achieved' : 'In Progress'
    });
    
    return { data: { success: true, allCompleted }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

// Team Challenges
export async function addTeamChallenge(organizationId: string, challengeData: TeamChallengeFormValues): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    if (!await checkGoalsEnabled(organizationId)) {
        return { data: null, error: 'Doelen en uitdagingen zijn uitgeschakeld voor deze organisatie.' };
    }
    await addDoc(collection(db, 'teamChallenges'), {
        ...challengeData,
        organizationId: organizationId,
        status: 'active',
        createdAt: new Date(),
    });
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function updateTeamChallenge(challengeId: string, challengeData: TeamChallengeFormValues): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const challengeRef = doc(db, 'teamChallenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);
    if (!challengeDoc.exists()) return { data: null, error: 'Uitdaging niet gevonden' };
     if (!await checkGoalsEnabled(challengeDoc.data().organizationId)) {
        return { data: null, error: 'Doelen en uitdagingen zijn uitgeschakeld voor deze organisatie.' };
    }
    await updateDoc(challengeRef, challengeData as any);
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function deleteTeamChallenge(challengeId: string): Promise<{ data: { success: boolean } | null; error: string | null; }> {
  try {
    const challengeRef = doc(db, 'teamChallenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);
    if (!challengeDoc.exists()) return { data: { success: true }, error: null };
    if (!await checkGoalsEnabled(challengeDoc.data().organizationId)) {
        return { data: null, error: 'Doelen en uitdagingen zijn uitgeschakeld voor deze organisatie.' };
    }
    await deleteDoc(challengeRef);
    return { data: { success: true }, error: null };
  } catch(e: any) {
    return { data: null, error: e.message };
  }
}

export async function completeTeamChallenge(challengeId: string, teamMemberIds: string[], reward: number): Promise<{ data: { success: boolean } | null; error: string | null; }> {
    if (teamMemberIds.length === 0) {
        return { data: null, error: 'Team is leeg.' };
    }
    
    try {
        const challengeRef = doc(db, 'teamChallenges', challengeId);
        const challengeDoc = await getDoc(challengeRef);
        if (!challengeDoc.exists()) return { data: null, error: 'Uitdaging niet gevonden' };
        if (!await checkGoalsEnabled(challengeDoc.data().organizationId)) {
            return { data: null, error: 'Doelen en uitdagingen zijn uitgeschakeld voor deze organisatie.' };
        }

        const batch = writeBatch(db);
        const rewardPerMember = Math.floor(reward / teamMemberIds.length);

        teamMemberIds.forEach(memberId => {
            const userRef = doc(db, 'users', memberId);
            batch.update(userRef, { points: increment(rewardPerMember) });
        });

        batch.update(challengeRef, { status: 'completed', completedAt: new Date() });
        
        await batch.commit();
        return { data: { success: true }, error: null };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
