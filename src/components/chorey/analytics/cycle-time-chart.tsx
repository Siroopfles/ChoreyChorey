'use client';

import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CycleTimeChartProps {
    data: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1.5">
          <p className="text-sm font-medium truncate max-w-xs">{label}</p>
          <p className="text-sm text-muted-foreground">
            Doorlooptijd: {payload[0].value} dag(en)
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function CycleTimeChart({ data }: CycleTimeChartProps) {
    const { theme } = useTheme();

    if(data.length === 0) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Geen data voor deze periode.</div>
    }

    return (
        <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" dataKey="value" unit="d" />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={60}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
