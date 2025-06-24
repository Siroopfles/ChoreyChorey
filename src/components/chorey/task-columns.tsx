'use client';
import type { Task, User, Status } from '@/lib/types';
import TaskCard from './task-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type TaskColumnsProps = {
  tasks: Task[];
  users: User[];
};

const TaskColumn = ({ title, tasks, users }: { title: Status; tasks: Task[]; users: User[] }) => {
  return (
    <div className="flex flex-col w-[320px] shrink-0">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-base font-semibold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="flex-grow space-y-3 p-2 overflow-y-auto rounded-md bg-muted min-h-[200px]">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} users={users} />)
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground/80">
            Geen taken hier.
          </div>
        )}
      </div>
    </div>
  );
};

const TaskColumns = ({ tasks, users }: TaskColumnsProps) => {
  const columns: Status[] = ["Te Doen", "In Uitvoering", "Voltooid", "Geannuleerd", "Gearchiveerd"];

  const tasksByStatus = (status: Status) => tasks.filter((task) => task.status === status).sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <ScrollArea className="w-full">
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
