'use client';
import type { Task, User, Status } from '@/lib/types';
import TaskCard from './task-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskColumnsProps = {
  tasks: Task[];
  users: User[];
};

const TaskColumn = ({ title, tasks, users }: { title: Status; tasks: Task[]; users: User[] }) => {
  return (
    <Card className="flex-1 flex flex-col min-w-[300px]">
      <CardHeader className="p-4">
        <CardTitle className="text-base font-medium font-headline">{title} <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span></CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4 pt-0 space-y-4 h-full">
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} users={users} />)
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Geen taken hier.
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

const TaskColumns = ({ tasks, users }: TaskColumnsProps) => {
  const todoTasks = tasks.filter((task) => task.status === 'To-do');
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');
  const doneTasks = tasks.filter((task) => task.status === 'Done');

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      <TaskColumn title="To-do" tasks={todoTasks} users={users} />
      <TaskColumn title="In Progress" tasks={inProgressTasks} users={users} />
      <TaskColumn title="Done" tasks={doneTasks} users={users} />
    </div>
  );
};

export default TaskColumns;
