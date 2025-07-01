
'use client';

import type { Task, User, MyTasksWidgetConfig } from '@/lib/types';
import { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';

export function MyTasksWidget({ config }: { config: MyTasksWidgetConfig }) {
  const { tasks, setViewedTask } = useTasks();
  const { user: currentUser } = useAuth();
    
  const myTasks = useMemo(() => {
    if (!currentUser || !tasks) return [];
    
    return tasks
        .filter(task => task.assigneeIds.includes(currentUser.id) && task.status !== 'Voltooid' && task.status !== 'Geannuleerd')
        .sort((a,b) => (a.dueDate ? a.dueDate.getTime() : Infinity) - (b.dueDate ? b.dueDate.getTime() : Infinity))
        .slice(0, config.limit || 5);

  }, [tasks, currentUser, config.limit]);

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
            <CardTitle className="flex items-center gap-2">
                <ClipboardList />
                Mijn Taken
            </CardTitle>
            <CardDescription>Je eerstvolgende openstaande taken.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {myTasks.length > 0 ? myTasks.map((task) => (
              <Button
                key={task.id}
                variant="ghost"
                className="w-full h-auto p-2 text-left flex flex-col items-start"
                onClick={() => setViewedTask(task)}
              >
                <p className="font-semibold text-sm truncate w-full">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {task.status}
                </p>
              </Button>
            )) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm font-semibold">Geen openstaande taken!</p>
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/my-week">Bekijk mijn week</Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </>
  );
}
