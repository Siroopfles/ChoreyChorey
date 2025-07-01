
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, FilePlus, LayoutTemplate, MoreVertical, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/feature/task-context';
import type { TaskTemplate, User } from '@/lib/types';
import AddTaskDialog from '@/components/chorey/dialogs/add-task-dialog';
import { TemplateDialog } from './template-dialog';

export function TemplateCard({ template, users }: { template: TaskTemplate; users: User[] }) {
  const { deleteTemplate } = useTasks();
  const { toast } = useToast();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);


  const onDelete = () => {
    deleteTemplate(template.id);
    toast({
      title: 'Template verwijderd',
      description: `Template "${template.name}" is verwijderd.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              {template.name}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setIsTemplateDialogOpen(true)}>
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
                      <AlertDialogDescription>
                        Deze actie kan niet ongedaan worden gemaakt. Dit zal de template permanent verwijderen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>"{template.title}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Prioriteit: {template.priority}</p>
          {template.labels && template.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.labels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" /> Taak aanmaken met template
          </Button>
        </CardFooter>
      </Card>
      
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        template={template}
      />
      
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        template={template}
      />
    </>
  );
}
