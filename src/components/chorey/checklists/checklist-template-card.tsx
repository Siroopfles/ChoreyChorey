'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClipboardList, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { ChecklistTemplateDialog } from './checklist-template-dialog';
import { useChecklists } from '@/contexts/checklist-context';
import type { ChecklistTemplate } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';

export function ChecklistTemplateCard({ template }: { template: ChecklistTemplate }) {
  const [isEditing, setIsEditing] = useState(false);
  const { manageChecklist } = useChecklists();

  const handleDelete = () => {
    manageChecklist('delete', undefined, template.id);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />{template.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Bewerken</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</DropdownMenuItem></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>{template.subtasks.length} subta(a)k(en)</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
            {template.subtasks.slice(0, 3).map((subtask, i) => <li key={i} className="truncate">{subtask}</li>)}
            {template.subtasks.length > 3 && <li>...en nog {template.subtasks.length - 3} meer.</li>}
          </ul>
        </CardContent>
      </Card>
      <ChecklistTemplateDialog open={isEditing} onOpenChange={setIsEditing} template={template} />
    </>
  );
}
