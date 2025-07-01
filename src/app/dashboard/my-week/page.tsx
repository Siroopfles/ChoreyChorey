

'use client';

import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { isWithinInterval, startOfToday, addDays, format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useMemo } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from '@/components/chorey/common/task-card';
import TaskColumnsSkeleton from '@/components/chorey/common/task-columns-skeleton';

export default function MyWeekPage() {
    const { tasks, loading: tasksLoading } = useTasks();
    const { user, users, loading: authLoading, projects } = useAuth();

    const weekTasks = useMemo(() => {
        if (!user) return [];
        const today = startOfToday();
        const endOfWeek = addDays(today, 7);
        return tasks.filter(task => 
            task.assigneeIds.includes(user.id) &&
            task.dueDate && 
            isWithinInterval(task.dueDate, { start: today, end: endOfWeek }) &&
            (task.status !== 'Voltooid' && task.status !== 'Geannuleerd')
        );
    }, [tasks, user]);

    const groupedTasks = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = addDays(today, i);
            const tasksForDay = weekTasks
                .filter(task => task.dueDate && isSameDay(task.dueDate, date))
                .sort((a,b) => a.priority.localeCompare(b.priority));

            if (tasksForDay.length > 0) {
                let dayLabel = format(date, 'eeee, d MMMM', { locale: nl });
                if (isSameDay(date, today)) {
                    dayLabel = `Vandaag, ${format(date, 'd MMMM', { locale: nl })}`;
                } else if (isSameDay(date, addDays(today, 1))) {
                    dayLabel = `Morgen, ${format(date, 'd MMMM', { locale: nl })}`;
                }
                groups[dayLabel] = tasksForDay;
            }
        }
        return groups;
    }, [weekTasks]);

    if (tasksLoading || authLoading) {
        return <TaskColumnsSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold">Mijn Week</h1>
                <p className="text-muted-foreground">Een overzicht van uw taken voor de komende 7 dagen.</p>
            </div>
            {Object.keys(groupedTasks).length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(groupedTasks).map(([day, dayTasks]) => (
                        <div key={day}>
                            <h2 className="text-xl font-semibold mb-4 capitalize">{day}</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {dayTasks.map(task => (
                                    <TaskCard key={task.id} task={task} users={users} currentUser={user} projects={projects} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                    <h3 className="text-2xl font-bold tracking-tight">Geen taken deze week!</h3>
                    <p className="text-sm text-muted-foreground">Geniet van de rust of voeg nieuwe taken met een einddatum toe.</p>
                </div>
            )}
        </div>
    );
}
