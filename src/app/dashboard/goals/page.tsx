'use client';

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';
import { GoalDialog } from '@/components/chorey/goals/goal-dialog';
import { GoalCard } from '@/components/chorey/goals/goal-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function GoalsPage() {
  const { personalGoals, loading } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target /> Mijn Persoonlijke Doelen
            </h1>
            <p className="text-muted-foreground">
              Volg je persoonlijke groei en ambities, los van je dagelijkse taken.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nieuw Doel
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
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nieuw Doel
            </Button>
          </div>
        )}
      </div>
      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
