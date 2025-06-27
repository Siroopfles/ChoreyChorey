'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import type { PersonalGoal, PersonalGoalFormValues, TeamChallengeFormValues, Milestone } from '@/lib/types';

// Personal Goals
export async function addPersonalGoal(organizationId: string, userId: string, goalData: PersonalGoalFormValues) {
  try {
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
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function updatePersonalGoal(goalId: string, goalData: PersonalGoalFormValues, existingMilestones: Milestone[]) {
  try {
    const goalRef = doc(db, 'personalGoals', goalId);
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
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function deletePersonalGoal(goalId: string) {
  try {
    await deleteDoc(doc(db, 'personalGoals', goalId));
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function toggleMilestoneCompletion(goalId: string, milestoneId: string, milestones: Milestone[]) {
  try {
    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const allCompleted = updatedMilestones.every(m => m.completed);
    
    const goalRef = doc(db, 'personalGoals', goalId);
    await updateDoc(goalRef, {
      milestones: updatedMilestones,
      status: allCompleted ? 'Achieved' : 'In Progress'
    });
    
    return { success: true, allCompleted: allCompleted };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Team Challenges
export async function addTeamChallenge(organizationId: string, challengeData: TeamChallengeFormValues) {
  try {
    await addDoc(collection(db, 'teamChallenges'), {
        ...challengeData,
        organizationId: organizationId,
        status: 'active',
        createdAt: new Date(),
    });
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function updateTeamChallenge(challengeId: string, challengeData: TeamChallengeFormValues) {
  try {
    const challengeRef = doc(db, 'teamChallenges', challengeId);
    await updateDoc(challengeRef, challengeData as any);
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function deleteTeamChallenge(challengeId: string) {
  try {
    await deleteDoc(doc(db, 'teamChallenges', challengeId));
    return { success: true };
  } catch(e: any) {
    return { error: e.message };
  }
}

export async function completeTeamChallenge(challengeId: string, teamMemberIds: string[], reward: number) {
    if (teamMemberIds.length === 0) {
        return { error: 'Team is leeg.' };
    }
    
    try {
        const batch = writeBatch(db);
        const rewardPerMember = Math.floor(reward / teamMemberIds.length);

        teamMemberIds.forEach(memberId => {
            const userRef = doc(db, 'users', memberId);
            batch.update(userRef, { points: increment(rewardPerMember) });
        });

        const challengeRef = doc(db, 'teamChallenges', challengeId);
        batch.update(challengeRef, { status: 'completed', completedAt: new Date() });
        
        await batch.commit();
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
