
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Task, Priority } from '@/lib/types';
import { GripVertical } from 'lucide-react';

const COLORS: Record<string, string> = {
    'Urgent': 'hsl(var(--chart-1))',
    'Hoog': 'hsl(var(--chart-2))',
    'Midden': 'hsl(var(--chart-3))',
    'Laag': 'hsl(var(--chart-4))',
};

export function TasksByPriorityWidget({ tasks }: { tasks: Task[] }) {
    const data = useMemo(() => {
        const priorityCounts = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {} as Record<Priority, number>);
        
        return Object.entries(priorityCounts)
            .map(([name, value]) => ({ name, value, fill: COLORS[name] || '#ccc' }))
            .filter(item => item.value > 0);
    }, [tasks]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Prioriteit Distributie</CardTitle>
                    <CardDescription>Hoe taken zijn verdeeld op basis van prioriteit.</CardDescription>
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
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
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
