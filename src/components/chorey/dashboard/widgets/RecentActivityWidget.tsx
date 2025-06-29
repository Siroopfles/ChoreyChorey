
'use client';

import type { Task, User, HistoryEntry } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GripVertical, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecentActivitySkeleton from './RecentActivitySkeleton';

interface RecentActivityWidgetProps {
    tasks: Task[];
    currentUser: User | null;
    setViewedTask: (task: Task | null) => void;
    isLoading: boolean;
}

type Activity = {
    task: Task;
    historyEntry: HistoryEntry;
}

export function RecentActivityWidget({ tasks, currentUser, setViewedTask, isLoading }: RecentActivityWidgetProps) {
    const recentActivity = useMemo((): Activity[] => {
        if (!currentUser || !tasks) return [];
        
        const allUserActivities: Activity[] = [];

        tasks.forEach(task => {
            (task.history || []).forEach(entry => {
                if (entry.userId === currentUser.id) {
                    allUserActivities.push({ task, historyEntry: entry });
                }
            });
        });

        // Sort all activities by date
        allUserActivities.sort((a, b) => b.historyEntry.timestamp.getTime() - a.historyEntry.timestamp.getTime());
        
        // Deduplicate, keeping only the most recent activity for each task
        const uniqueTasks = new Map<string, Activity>();
        for (const activity of allUserActivities) {
            if (!uniqueTasks.has(activity.task.id)) {
                uniqueTasks.set(activity.task.id, activity);
            }
        }
        
        return Array.from(uniqueTasks.values()).slice(0, 10);

    }, [tasks, currentUser]);

    if (isLoading) {
        return <RecentActivitySkeleton />;
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Clock />
                        Mijn Recente Activiteit
                    </CardTitle>
                    <CardDescription>De laatste taken waar je aan gewerkt hebt.</CardDescription>
                </div>
                <div className="react-grid-drag-handle cursor-grab active:cursor-grabbing p-1">
                    <GripVertical />
                </div>
            </CardHeader>
            <CardContent className="flex-grow min-h-0">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? recentActivity.map(({ task, historyEntry }) => (
                            <Button
                                key={task.id + historyEntry.id}
                                variant="ghost"
                                className="w-full h-auto p-2 text-left flex flex-col items-start"
                                onClick={() => setViewedTask(task)}
                            >
                                <p className="font-semibold text-sm truncate w-full">{task.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {historyEntry.action} - {formatDistanceToNow(historyEntry.timestamp, { addSuffix: true, locale: nl })}
                                </p>
                            </Button>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Nog geen recente activiteit om weer te geven.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
