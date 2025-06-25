'use client';

import type { User, Task } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const priorityColors: Record<Task['priority'], string> = {
  Urgent: 'border-l-chart-1',
  Hoog: 'border-l-chart-2',
  Midden: 'border-l-chart-3',
  Laag: 'border-l-chart-4',
};

function UserStats({ user, userTasks }: { user: User; userTasks: Task[] }) {
  const completedTasks = userTasks.filter(t => t.status === 'Voltooid').length;

  return (
    <div className="grid grid-cols-2 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Punten</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{user.points.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taken Voltooid</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{completedTasks}</div>
            </CardContent>
        </Card>
    </div>
  );
}

export default function UserProfileSheet({
  user,
  isOpen,
  onOpenChange,
}: {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tasks } = useTasks();
  const userTasks = tasks.filter(task => task.assigneeId === user.id);
  const currentTasks = userTasks.filter(t => t.status === 'Te Doen' || t.status === 'In Uitvoering');

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl">{user.name}</SheetTitle>
              <SheetDescription>
                Een gewaardeerd teamlid
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="my-4" />

        <UserStats user={user} userTasks={userTasks} />
        
        <div className="flex-1 overflow-y-auto space-y-4 pt-4">
             <h4 className="text-sm font-medium text-muted-foreground">HUIDIGE TAKEN ({currentTasks.length})</h4>
            {currentTasks.length > 0 ? (
                <div className="space-y-2">
                    {currentTasks.map(task => (
                        <div key={task.id} className={cn("flex flex-col rounded-md border p-3 border-l-4", priorityColors[task.priority])}>
                            <p className="font-semibold text-sm">{task.title}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                               <span>Status: {task.status}</span>
                               {task.dueDate && <span>Einddatum: {format(task.dueDate, 'd MMM', {locale: nl})}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    Geen actieve taken toegewezen.
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
