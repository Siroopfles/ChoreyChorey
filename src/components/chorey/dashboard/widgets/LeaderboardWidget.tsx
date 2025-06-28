
'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import type { User } from '@/lib/types';

export function LeaderboardWidget({ users }: { users: User[] }) {
    const { resolvedTheme } = useTheme();

    const data = useMemo(() => {
        const lightness = resolvedTheme === 'dark' ? 60 : 45;
        return users
            .map(user => ({
                name: user.name,
                points: user.points,
                fill: `hsl(${user.id.charCodeAt(0) % 360}, 70%, ${lightness}%)`
            }))
            .sort((a,b) => b.points - a.points)
            .slice(0, 10); // Show top 10
    }, [users, resolvedTheme]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Scorebord</CardTitle>
                <CardDescription>Totaal aantal punten per gebruiker.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" dataKey="points" />
                            <YAxis type="category" dataKey="name" width={60} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
