
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Zap } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';
import { AutomationCard } from '@/components/chorey/automations/automation-card';
import { AutomationDialog } from '@/components/chorey/automations/automation-dialog';
import { PERMISSIONS } from '@/lib/types';

export default function AutomationsPage() {
  const { automations, loading } = useTasks();
  const { currentUserPermissions } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap /> Automatiseringen
            </h1>
            <p className="text-muted-foreground">
              Automatiseer repetitieve taken en stroomlijn uw workflows.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nieuwe Automatisering
            </Button>
          )}
        </div>
        
        {automations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
            <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-bold tracking-tight">Creëer je eerste automatisering</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bespaar tijd door workflows op te zetten die automatisch worden uitgevoerd.
            </p>
            {canManage && (
              <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nieuwe Automatisering
              </Button>
            )}
          </div>
        )}
      </div>
      {canManage && <AutomationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />}
    </>
  );
}
