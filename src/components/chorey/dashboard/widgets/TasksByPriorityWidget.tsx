

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Bar, XAxis, YAxis, BarChart, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import type { Task, Priority, ChartWidgetConfig } from '@/lib/types';
import { GripVertical } from 'lucide-react';


const COLORS: Record<string, string> = {
    'Urgent': 'hsl(var(--chart-1))',
    'Hoog': 'hsl(var(--chart-2))',
    'Midden': 'hsl(var(--chart-3))',
    'Laag': 'hsl(var(--chart-4))',
};

export function TasksByPriorityWidget({ tasks, config }: { tasks: Task[], config: ChartWidgetConfig }) {
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
        <>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle>Prioriteit Distributie</CardTitle>
                    <CardDescription>Taken verdeeld op basis van prioriteit.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                         {config.chartType === 'bar' ? (
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="value">
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        ) : (
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </>
    );
}
