
'use client';

import type { Task } from '@/lib/types';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gantt, ViewMode, type Task as GanttTask } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useTasks } from '@/contexts/feature/task-context';

type GanttViewProps = {
  tasks: Task[];
};

export default function GanttView({ tasks: choreyTasks }: GanttViewProps) {
  const { resolvedTheme } = useTheme();
  const { setViewedTask } = useTasks();

  const ganttTasks: GanttTask[] = useMemo(() => {
    return choreyTasks
      .filter(task => task.dueDate && task.createdAt)
      .map(task => ({
        start: task.createdAt,
        end: task.dueDate!,
        name: task.title,
        id: task.id,
        type: 'task',
        progress: 100, // Placeholder, can be linked to subtasks later
        isDisabled: false,
        dependencies: task.blockedBy || [],
        styles: {
          backgroundColor: resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb',
          backgroundSelectedColor: resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6',
          progressColor: resolvedTheme === 'dark' ? '#93c5fd' : '#bfdbfe',
          progressSelectedColor: '#aed1fc'
        }
      }));
  }, [choreyTasks, resolvedTheme]);

  const handleTaskClick = (task: GanttTask) => {
    const originalTask = choreyTasks.find(t => t.id === task.id);
    if (originalTask) {
      setViewedTask(originalTask);
    }
  };

  if (ganttTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gantt-diagram</CardTitle>
          <CardDescription>Een tijdlijn van uw taken en hun afhankelijkheden.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Geen taken met een einddatum om weer te geven.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt-diagram</CardTitle>
        <CardDescription>Een interactieve tijdlijn van uw taken en hun afhankelijkheden.</CardDescription>
      </CardHeader>
      <CardContent className="h-[600px] w-full pr-6">
        <Gantt
          tasks={ganttTasks}
          viewMode={ViewMode.Day}
          onClick={handleTaskClick}
          listCellWidth=""
          ganttHeight={500}
          barBackgroundColor={resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb'}
          barBackgroundSelectedColor={resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'}
          barProgressColor={resolvedTheme === 'dark' ? '#93c5fd' : '#bfdbfe'}
          barProgressSelectedColor='#aed1fc'
          arrowColor={resolvedTheme === 'dark' ? '#e2e8f0' : '#64748b'}
          todayColor={resolvedTheme === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(252, 165, 165, 0.5)'}
          fontFamily='var(--font-inter), sans-serif'
          columnWidth={65}
        />
      </CardContent>
    </Card>
  );
}
