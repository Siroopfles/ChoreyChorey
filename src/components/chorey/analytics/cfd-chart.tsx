'use client';

import { useTheme } from 'next-themes';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { CfdDataPoint } from '@/app/actions/analytics.actions';

interface CfdChartProps {
    data: CfdDataPoint[];
    statuses: string[];
}

const stringToColor = (str: string, saturation = 70, lightness = 50) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}


export function CfdChart({ data, statuses }: CfdChartProps) {
    const { resolvedTheme } = useTheme();

    if (data.length === 0) {
        return <div className="flex h-[400px] items-center justify-center text-muted-foreground">Geen data voor deze periode.</div>
    }

    return (
        <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {statuses.map(status => (
                        <Area
                            key={status}
                            type="monotone"
                            dataKey={status}
                            stackId="1"
                            stroke={stringToColor(status, 70, resolvedTheme === 'dark' ? 60: 45)}
                            fill={stringToColor(status, 70, resolvedTheme === 'dark' ? 60: 45)}
                            fillOpacity={0.8}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
