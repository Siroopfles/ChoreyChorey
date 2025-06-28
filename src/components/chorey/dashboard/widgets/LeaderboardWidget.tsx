
'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import type { User } from '@/lib/types';
import { GripVertical, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function LeaderboardWidget({ users }: { users: User[] }) {
    const { resolvedTheme } = useTheme();
    const { toast } = useToast();

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

    const handleCopyData = () => {
        try {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            toast({ title: "Data Gekopieerd", description: "De widgetdata is naar je klembord gekopieerd." });
        } catch (err) {
            toast({ title: "Fout", description: "Kon de data niet kopiëren.", variant: 'destructive' });
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Scorebord</CardTitle>
                    <CardDescription>Totaal aantal punten per gebruiker.</CardDescription>
                </div>
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyData} aria-label="Kopieer data">
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                    <div className="react-grid-drag-handle cursor-grab active:cursor-grabbing p-1">
                        <GripVertical />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <ChartContainer config={{}} className="h-full w-full">
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
