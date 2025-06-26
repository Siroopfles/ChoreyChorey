
'use client';

import type { Task } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, differenceInDays, startOfDay, addDays, addHours } from 'date-fns';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type GanttViewProps = {
  tasks: Task[];
};

export default function GanttView({ tasks }: GanttViewProps) {
    const { resolvedTheme } = useTheme();

    const { data: chartData, projectStart } = useMemo(() => {
        // 1. Filter for tasks that can be plotted and create a map for easy access.
        const tasksWithDates = tasks.filter(t => t.dueDate);
        if (tasksWithDates.length === 0) return { data: [], projectStart: new Date() };
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        const memo = new Map<string, { start: Date, end: Date }>();

        // 2. Recursive function to calculate the actual start date of a task.
        const getTaskTiming = (taskId: string, path: Set<string> = new Set()): { start: Date, end: Date } => {
            if (path.has(taskId)) {
                // Circular dependency detected
                console.warn(`Circular dependency detected in Gantt chart involving task ${taskId}.`);
                const task = taskMap.get(taskId)!;
                return { start: startOfDay(task.createdAt), end: startOfDay(task.dueDate!) };
            }
            if (memo.has(taskId)) {
                return memo.get(taskId)!;
            }

            const task = taskMap.get(taskId);
            if (!task || !task.dueDate) {
                // Should not happen due to initial filtering, but as a safeguard.
                const fallbackDate = new Date();
                return { start: fallbackDate, end: fallbackDate };
            }
            
            path.add(taskId);

            let earliestStart = startOfDay(task.createdAt);

            // 3. Calculate start date based on dependencies.
            if (task.blockedBy && task.blockedBy.length > 0) {
                const blockerEndDates = task.blockedBy
                    .map(blockerId => {
                        if (!taskMap.has(blockerId) || !taskMap.get(blockerId)!.dueDate) {
                            return null; // Blocker is not on the chart, ignore it.
                        }
                        const blockerTiming = getTaskTiming(blockerId, new Set(path));
                        const dependencyConfig = task.dependencyConfig?.[blockerId];
                        if (dependencyConfig) {
                            const { lag, unit } = dependencyConfig;
                            const addFn = unit === 'hours' ? addHours : addDays;
                            return addFn(blockerTiming.end, lag);
                        }
                        return blockerTiming.end;
                    })
                    .filter((d): d is Date => d !== null);

                if (blockerEndDates.length > 0) {
                    const latestBlockerEnd = new Date(Math.max(...blockerEndDates.map(d => d.getTime())));
                    earliestStart = new Date(Math.max(earliestStart.getTime(), latestBlockerEnd.getTime()));
                }
            }
            
            const result = { start: earliestStart, end: startOfDay(task.dueDate!) };
            memo.set(taskId, result);
            path.delete(taskId);
            return result;
        };

        // 4. Calculate timing for all relevant tasks.
        tasksWithDates.forEach(task => {
            if (!memo.has(task.id)) {
                getTaskTiming(task.id);
            }
        });

        // 5. Determine the overall project start date for the X-axis.
        const allStartDates = Array.from(memo.values()).map(t => t.start);
        if (allStartDates.length === 0) return { data: [], projectStart: new Date() };

        const overallProjectStart = new Date(Math.min(...allStartDates.map(d => d.getTime())));

        // 6. Format data for the chart component.
        const data = tasksWithDates.map(task => {
            const timing = memo.get(task.id)!;
            const startOffset = differenceInDays(timing.start, overallProjectStart);
            const duration = differenceInDays(timing.end, timing.start) + 1;

            return {
                name: task.title,
                start: startOffset,
                duration: duration > 0 ? duration : 1,
                // Pass original dates for tooltip
                actualStart: timing.start,
                actualEnd: timing.end,
            };
        }).sort((a,b) => a.actualStart.getTime() - b.actualStart.getTime());

        return { data, projectStart: overallProjectStart };
    }, [tasks]);


    if (chartData.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Gantt-diagram</CardTitle>
                    <CardDescription>Een tijdlijn van uw taken.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-96">
                        <p className="text-muted-foreground">Geen taken met een einddatum om weer te geven.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
                    <p className="font-bold">{label}</p>
                    <p>Start: {format(data.actualStart, 'd MMM yyyy')}</p>
                    <p>Einde: {format(data.actualEnd, 'd MMM yyyy')}</p>
                    <p>Duur: {data.duration} dagen</p>
                </div>
            );
        }
        return null;
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gantt-diagram</CardTitle>
                <CardDescription>Een tijdlijn van uw taken.</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] w-full pr-6">
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" dataKey="date" name="Dagen vanaf start" unit="d" />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                        <Bar dataKey="start" stackId="a" fill="transparent" />
                        <Bar dataKey="duration" stackId="a" fill={resolvedTheme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--primary))'} radius={[4, 4, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
