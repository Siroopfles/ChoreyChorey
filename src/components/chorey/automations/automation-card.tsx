
'use client';

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AutomationDialog } from './automation-dialog';
import { AUTOMATION_TRIGGER_TYPES, AUTOMATION_ACTION_TYPES, type Automation } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';

export function AutomationCard({ automation }: { automation: Automation }) {
  const { manageAutomation } = useTasks();
  const { users, currentUserPermissions } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION);

  const handleToggle = (enabled: boolean) => {
    manageAutomation('update', { ...automation, enabled });
  };
  
  const handleDelete = () => {
    manageAutomation('delete', automation);
  };

  const triggerText = AUTOMATION_TRIGGER_TYPES[automation.trigger.type];
  const actionText = AUTOMATION_ACTION_TYPES[automation.action.type];
  
  const getFilterDescription = () => {
      const filters = automation.trigger.filters;
      if (!filters) return null;
      const parts = [];
      if (filters.priority) parts.push(`met prioriteit '${filters.priority}'`);
      if (filters.label) parts.push(`met label '${filters.label}'`);
      return parts.length > 0 ? `Indien ${parts.join(' en ')}` : null;
  }
  
  const getActionDescription = () => {
      const params = automation.action.params;
      if (automation.action.type === 'task.assign' && params.assigneeId) {
          const user = users.find(u => u.id === params.assigneeId);
          return `aan ${user?.name || 'onbekende gebruiker'}`;
      }
      return '';
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{automation.name}</CardTitle>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Bewerken
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                        <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription>Een workflow om taken te automatiseren.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center text-sm">
                <div className="p-3 bg-muted rounded-md w-full">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">Wanneer...</p>
                    <p className="font-semibold">{triggerText}</p>
                    {getFilterDescription() && <p className="text-xs text-muted-foreground">{getFilterDescription()}</p>}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                 <div className="p-3 bg-muted rounded-md w-full">
                    <p className="font-semibold text-muted-foreground text-xs uppercase">Doe dan dit...</p>
                    <p className="font-semibold">{actionText} {getActionDescription()}</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center space-x-2">
            <Switch
              id={`automation-toggle-${automation.id}`}
              checked={automation.enabled}
              onCheckedChange={handleToggle}
              disabled={!canManage}
            />
            <Label htmlFor={`automation-toggle-${automation.id}`}>
              {automation.enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
            </Label>
          </div>
        </CardFooter>
      </Card>
      {canManage && <AutomationDialog open={isEditing} onOpenChange={setIsEditing} automation={automation} />}
    </>
  );
}
