
'use client';

import { useState } from 'react';
import { useIdeas } from '@/contexts/idea-context';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';
import { IdeaDialog } from '@/components/chorey/ideas/idea-dialog';
import { IdeaCard } from '@/components/chorey/ideas/idea-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Idea } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

export default function IdeasPage() {
  const { ideas, loading } = useIdeas();
  const { currentUserPermissions } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const groupedIdeas = ideas.reduce((acc, idea) => {
    const status = idea.status || 'new';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  const sortedAndGroupedIdeas = {
    new: (groupedIdeas.new || []).sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0)),
    planned: groupedIdeas.planned || [],
    'in-progress': groupedIdeas['in-progress'] || [],
    completed: groupedIdeas.completed || [],
  };

  const ideaStatuses = [
    { value: 'new', label: 'Nieuw' },
    { value: 'planned', label: 'Gepland' },
    { value: 'in-progress', label: 'In Uitvoering' },
    { value: 'completed', label: 'Voltooid' },
  ];

  if (loading) {
     return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-96" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
      </div>
     )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb /> Ideeënbus
            </h1>
            <p className="text-muted-foreground">
              Deel je ideeën voor nieuwe features en stem op de voorstellen van anderen.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nieuw Idee
          </Button>
        </div>
        
        <Tabs defaultValue="new" className="w-full">
            <TabsList>
                {ideaStatuses.map(status => (
                    <TabsTrigger key={status.value} value={status.value}>
                        {status.label} ({(sortedAndGroupedIdeas[status.value as keyof typeof sortedAndGroupedIdeas] || []).length})
                    </TabsTrigger>
                ))}
            </TabsList>
             {ideaStatuses.map(status => (
                <TabsContent key={status.value} value={status.value} className="mt-6">
                    {(sortedAndGroupedIdeas[status.value as keyof typeof sortedAndGroupedIdeas] || []).length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sortedAndGroupedIdeas[status.value as keyof typeof sortedAndGroupedIdeas].map((idea) => (
                                <IdeaCard key={idea.id} idea={idea} currentUserPermissions={currentUserPermissions} />
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                            <h3 className="text-2xl font-bold tracking-tight">Geen ideeën in deze categorie</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Er zijn momenteel geen ideeën met de status "{status.label}".
                            </p>
                        </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
      </div>
      <IdeaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
