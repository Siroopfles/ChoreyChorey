'use client';

import type { Task, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function TaskListView({ tasks, users }: { tasks: Task[], users: User[] }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleRowClick = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Taak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioriteit</TableHead>
              <TableHead>Toegewezen aan</TableHead>
              <TableHead>Einddatum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
              return (
                <TableRow key={task.id} onClick={() => handleRowClick(task)} className="cursor-pointer">
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>
                    {assignees.length > 0 ? (
                      <div className="flex items-center -space-x-2">
                        {assignees.map(assignee => (
                          <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={assignee.avatar} alt={assignee.name} />
                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Niemand</span>
                    )}
                  </TableCell>
                  <TableCell>{task.dueDate ? format(task.dueDate, 'd MMM yyyy', { locale: nl }) : '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {editingTask && (
        <EditTaskDialog
          isOpen={!!editingTask}
          setIsOpen={(isOpen) => { if (!isOpen) setEditingTask(null); }}
          task={editingTask}
          users={users}
        />
      )}
    </>
  );
}