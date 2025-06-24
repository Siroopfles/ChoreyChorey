'use client';
import type { Task, User, Status } from '@/lib/types';
import TaskCard from './task-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type TaskColumnsProps = {
  tasks: Task[];
  users: User[];
};

const TaskColumn = ({ title, tasks, users }: { title: Status; tasks: Task[]; users: User[] }) => {
  return (
    <div className="flex-1 flex flex-col min-w-[300px] max-w-[350px]">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold font-headline">{title} <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span></CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow rounded-md">
        <CardContent className="p-4 pt-2 space-y-3 h-full">
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} users={users} />)
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Geen taken hier.
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </div>
  );
};

const TaskColumns = ({ tasks, users }: TaskColumnsProps) => {
  const columns: Status[] = ["Te Doen", "In Uitvoering", "Voltooid", "Geannuleerd", "Gearchiveerd"];

  const tasksByStatus = (status: Status) => tasks.filter((task) => task.status === status);

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-6 pb-4">
        {columns.map((status) => (
          <TaskColumn key={status} title={status} tasks={tasksByStatus(status)} users={users} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default TaskColumns;
