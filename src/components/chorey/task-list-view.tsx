
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
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { HandHeart, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useTasks } from '@/contexts/task-context';


export default function TaskListView({ tasks, users }: { tasks: Task[], users: User[] }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { loadMoreTasks, hasMoreTasks, isMoreLoading } = useTasks();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView && !isMoreLoading) {
      loadMoreTasks();
    }
  }, [inView, isMoreLoading, loadMoreTasks]);


  const handleRowClick = (task: Task) => {
    setEditingTask(task);
  };

  if (tasks.length === 0 && !isMoreLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
        <HandHeart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight mt-4">Geen taken gevonden</h3>
        <p className="text-sm text-muted-foreground">Er zijn geen taken die aan de huidige criteria voldoen.</p>
      </div>
    );
  }

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
            {tasks.map((task, index) => {
              const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
              // Add the ref to the last element to trigger loading more
              const isLastElement = index === tasks.length - 1;
              return (
                <TableRow key={task.id} onClick={() => handleRowClick(task)} className="cursor-pointer" ref={isLastElement ? ref : null}>
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
             {isMoreLoading && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                </TableRow>
            )}
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
