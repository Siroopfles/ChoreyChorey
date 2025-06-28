
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Task, Status } from '@/lib/types';
import { GripVertical } from 'lucide-react';

const COLORS: Record<string, string> = {
    'Te Doen': 'hsl(var(--status-todo))',
    'In Uitvoering': 'hsl(var(--status-inprogress))',
    'Voltooid': 'hsl(var(--status-completed))',
    'Geannuleerd': 'hsl(var(--status-cancelled))',
    'Gearchiveerd': 'hsl(var(--status-archived))',
    'In Review': 'hsl(var(--status-in-review))',
};

export function TasksByStatusWidget({ tasks }: { tasks: Task[] }) {
    const data = useMemo(() => {
        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);
        
        return Object.entries(statusCounts)
            .map(([name, value]) => ({ name, value, fill: COLORS[name] || '#ccc' }))
            .filter(item => item.value > 0);
    }, [tasks]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Taak Status</CardTitle>
                    <CardDescription>Distributie van taken per status.</CardDescription>
                </div>
                 <div className="react-grid-drag-handle cursor-grab active:cursor-grabbing">
                    <GripVertical />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <ChartContainer config={{}} className="mx-auto aspect-square h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
