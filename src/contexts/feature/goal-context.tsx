
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import type { PersonalGoal, PersonalGoalFormValues, TeamChallenge, TeamChallengeFormValues, Milestone } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { useTasks } from '@/contexts/feature/task-context';
import { addPersonalGoal as addPersonalGoalAction, updatePersonalGoal as updatePersonalGoalAction, deletePersonalGoal as deletePersonalGoalAction, toggleMilestoneCompletion as toggleMilestoneCompletionAction } from '@/app/actions/project/goal.actions';
import { addTeamChallenge as addTeamChallengeAction, updateTeamChallenge as updateTeamChallengeAction, deleteTeamChallenge as deleteTeamChallengeAction, completeTeamChallenge as completeTeamChallengeAction } from '@/app/actions/project/goal.actions';

type GoalContextType = {
  personalGoals: PersonalGoal[];
  teamChallenges: TeamChallenge[];
  loading: boolean;
  addPersonalGoal: (goalData: PersonalGoalFormValues) => Promise<boolean>;
  updatePersonalGoal: (goalId: string, goalData: PersonalGoalFormValues) => Promise<boolean>;
  deletePersonalGoal: (goalId: string) => Promise<void>;
  toggleMilestoneCompletion: (goalId: string, milestoneId: string) => Promise<void>;
  addTeamChallenge: (challengeData: TeamChallengeFormValues) => Promise<boolean>;
  updateTeamChallenge: (challengeId: string, challengeData: TeamChallengeFormValues) => Promise<boolean>;
  deleteTeamChallenge: (challengeId: string) => Promise<void>;
  completeTeamChallenge: (challengeId: string) => Promise<void>;
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization, teams, users: allUsers } = useOrganization();
  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([]);
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message, variant: 'destructive' });
  };

  useEffect(() => {
    if (!currentOrganization || !user) {
      setPersonalGoals([]);
      setTeamChallenges([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const commonQuery = (collectionName: string) => query(collection(db, collectionName), where("organizationId", "==", currentOrganization.id));
    const userSpecificQuery = (collectionName: string) => query(commonQuery(collectionName), where("userId", "==", user.id));

    const unsubGoals = onSnapshot(userSpecificQuery('personalGoals'), (s) => setPersonalGoals(s.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate(), targetDate: (d.data().targetDate as Timestamp)?.toDate(), milestones: d.data().milestones || [] } as PersonalGoal)).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())), (e) => handleError(e, 'laden van doelen'));
    const unsubChallenges = onSnapshot(commonQuery('teamChallenges'), (s) => {
        setTeamChallenges(s.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate(), completedAt: (d.data().completedAt as Timestamp)?.toDate()} as TeamChallenge)).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
        setLoading(false);
    }, (e) => {
        handleError(e, 'laden van uitdagingen');
        setLoading(false);
    });

    return () => {
      unsubGoals();
      unsubChallenges();
    };
  }, [user, currentOrganization]);

  const addPersonalGoal = async (goalData: PersonalGoalFormValues): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    const result = await addPersonalGoalAction(currentOrganization.id, user.id, goalData);
    if (result.error) { handleError({ message: result.error }, 'opslaan doel'); return false; }
    toast({ title: 'Doel Aangemaakt!', description: `Je nieuwe doel "${goalData.title}" is opgeslagen.` });
    return true;
  };

  const updatePersonalGoal = async (goalId: string, goalData: PersonalGoalFormValues): Promise<boolean> => {
    const existingGoal = personalGoals.find(g => g.id === goalId);
    if (!existingGoal) return false;
    const result = await updatePersonalGoalAction(goalId, goalData, existingGoal.milestones);
    if (result.error) { handleError({ message: result.error }, 'bijwerken doel'); return false; }
    toast({ title: 'Doel Bijgewerkt!' });
    return true;
  };

  const deletePersonalGoal = async (goalId: string) => {
    const result = await deletePersonalGoalAction(goalId);
    if (result.error) { handleError({ message: result.error }, 'verwijderen doel'); } 
    else { toast({ title: 'Doel Verwijderd' }); }
  };
  
  const toggleMilestoneCompletion = async (goalId: string, milestoneId: string) => {
    const goal = personalGoals.find(g => g.id === goalId);
    if (!goal) return;
    const result = await toggleMilestoneCompletionAction(goalId, milestoneId, goal.milestones);
    if (result.error) { handleError({ message: result.error }, 'bijwerken mijlpaal'); } 
    else if (result.allCompleted) { toast({ title: 'Doel Behaald!', description: `Gefeliciteerd met het behalen van je doel: "${goal.title}"` }); }
  };

  const addTeamChallenge = async (challengeData: TeamChallengeFormValues): Promise<boolean> => {
    if (!currentOrganization) return false;
    const result = await addTeamChallengeAction(currentOrganization.id, challengeData);
    if (result.error) { handleError({ message: result.error }, 'opslaan uitdaging'); return false; }
    toast({ title: 'Uitdaging Aangemaakt!', description: `De uitdaging "${challengeData.title}" is gestart.` });
    return true;
  };

  const updateTeamChallenge = async (challengeId: string, challengeData: TeamChallengeFormValues): Promise<boolean> => {
    const result = await updateTeamChallengeAction(challengeId, challengeData);
    if (result.error) { handleError({ message: result.error }, 'bijwerken uitdaging'); return false; }
    toast({ title: 'Uitdaging Bijgewerkt!' });
    return true;
  };

  const deleteTeamChallenge = async (challengeId: string) => {
    const result = await deleteTeamChallengeAction(challengeId);
    if (result.error) { handleError({ message: result.error }, 'verwijderen uitdaging'); }
    else { toast({ title: 'Uitdaging Verwijderd' }); }
  };

  const completeTeamChallenge = async (challengeId: string) => {
    if (!currentOrganization) return;
    const challenge = teamChallenges.find(c => c.id === challengeId);
    const team = teams.find(t => t.id === challenge?.teamId);
    if (!challenge || !team) { handleError({ message: 'Uitdaging of team niet gevonden.'}, 'voltooien uitdaging'); return; }
    
    const result = await completeTeamChallengeAction(challenge.id, team.memberIds, challenge.reward);
    if (result.error) { handleError({ message: result.error }, 'voltooien uitdaging'); }
    else { toast({ title: 'Uitdaging Voltooid!', description: `Team ${team.name} heeft ${challenge.reward} punten verdiend!` }); }
  };

  return (
    <GoalContext.Provider value={{
      personalGoals, teamChallenges, loading, addPersonalGoal,
      updatePersonalGoal, deletePersonalGoal, toggleMilestoneCompletion,
      addTeamChallenge, updateTeamChallenge, deleteTeamChallenge, completeTeamChallenge
    }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
