
'use client';

import type { Task } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type GanttViewProps = {
  tasks: Task[];
};

export default function GanttView({ tasks }: GanttViewProps) {
    const { resolvedTheme } = useTheme();

    const chartData = useMemo(() => {
        const tasksWithDates = tasks.filter(t => t.dueDate).sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
        if(tasksWithDates.length === 0) return { data: [], projectStart: new Date() };

        const projectStart = startOfDay(tasksWithDates[0].createdAt);

        const data = tasksWithDates.map(task => {
            const start = startOfDay(task.createdAt);
            const end = startOfDay(task.dueDate!);
            
            const startOffset = differenceInDays(start, projectStart);
            const duration = differenceInDays(end, start) + 1;

            return {
                name: task.title,
                start: startOffset,
                duration: duration > 0 ? duration : 1,
            };
        });

        return { data, projectStart };
    }, [tasks]);


    if (chartData.data.length === 0) {
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
            const taskStart = new Date(chartData.projectStart);
            taskStart.setDate(taskStart.getDate() + payload[0].payload.start);

            const taskEnd = addDays(taskStart, payload[0].payload.duration - 1);

            return (
                <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
                    <p className="font-bold">{label}</p>
                    <p>Start: {format(taskStart, 'd MMM yyyy')}</p>
                    <p>Einde: {format(taskEnd, 'd MMM yyyy')}</p>
                    <p>Duur: {payload[0].payload.duration} dagen</p>
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
                        data={chartData.data}
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
