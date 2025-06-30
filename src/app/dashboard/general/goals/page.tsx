
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Target, Plus, Trophy, Users } from 'lucide-react';
import { GoalDialog } from '@/components/chorey/goals/goal-dialog';
import { GoalCard } from '@/components/chorey/goals/goal-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChallengeDialog } from '@/components/chorey/goals/challenge-dialog';
import { ChallengeCard } from '@/components/chorey/goals/challenge-card';
import { PERMISSIONS } from '@/lib/types';
import { useGoals } from '@/contexts/goal-context';


export default function GoalsPage() {
  const { personalGoals, teamChallenges, loading } = useGoals();
  const { currentUserPermissions } = useAuth();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);

  const canManageChallenges = currentUserPermissions.includes(PERMISSIONS.MANAGE_GOALS);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy /> Doelen &amp; Uitdagingen
            </h1>
            <p className="text-muted-foreground">
              Volg je persoonlijke groei en ga de strijd aan met teamuitdagingen.
            </p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal"><Target className="mr-2 h-4 w-4"/> Persoonlijke Doelen</TabsTrigger>
                <TabsTrigger value="team"><Users className="mr-2 h-4 w-4"/> Team Uitdagingen</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="mt-6">
                <div className="flex justify-end mb-4">
                    <Button onClick={() => setGoalDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nieuw Persoonlijk Doel
                    </Button>
                </div>
                {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
                ) : personalGoals.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {personalGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-bold tracking-tight">Stel je eerste doel in</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                    Wat wil je bereiken? Creëer een nieuw persoonlijk doel om te beginnen.
                    </p>
                    <Button className="mt-6" onClick={() => setGoalDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nieuw Doel
                    </Button>
                </div>
                )}
            </TabsContent>
            
            <TabsContent value="team" className="mt-6">
                 <div className="flex justify-end mb-4">
                    {canManageChallenges && (
                        <Button onClick={() => setChallengeDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nieuwe Uitdaging
                        </Button>
                    )}
                </div>
                 {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
                ) : teamChallenges.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teamChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-bold tracking-tight">Geen teamuitdagingen actief</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Beheerders kunnen een nieuwe uitdaging aanmaken om de competitie te starten.
                    </p>
                     {canManageChallenges && (
                        <Button className="mt-6" onClick={() => setChallengeDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nieuwe Uitdaging
                        </Button>
                    )}
                </div>
                )}
            </TabsContent>
        </Tabs>
      </div>
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
      <ChallengeDialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen} />
    </>
  );
}
