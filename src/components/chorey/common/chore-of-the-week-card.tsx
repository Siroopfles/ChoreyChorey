
'use client';

import type { Task, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Eye } from 'lucide-react';
import { useTasks } from '@/contexts/feature/task-context';
import { useState } from 'react';
import EditTaskDialog from '@/components/chorey/dialogs/edit-task-dialog';

type ChoreOfTheWeekCardProps = {
  task: Task;
  users: User[];
};

export function ChoreOfTheWeekCard({ task, users }: ChoreOfTheWeekCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-bold text-yellow-800 dark:text-yellow-300">
            <Star className="h-6 w-6" />
            <span>Klus van de Week</span>
          </CardTitle>
          <CardDescription>Deze taak is speciaal uitgelicht. Wie pakt de uitdaging op?</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
          {task.description && (
            <div
              className="prose dark:prose-invert max-w-none text-sm text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          )}
          <Button size="sm" className="mt-4" onClick={() => setIsEditDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Bekijk & Pak Op
          </Button>
        </CardContent>
      </Card>
      {isEditDialogOpen && (
        <EditTaskDialog
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            task={task}
        />
      )}
    </>
  );
}
