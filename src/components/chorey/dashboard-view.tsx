
'use client';

import type { Task, User, Status, Priority, ActivityFeedItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { ActivityFeed } from './activity-feed';
import ActivityFeedSkeleton from './activity-feed-skeleton';


const COLORS: Record<string, string> = {
    // Status
    'Te Doen': 'hsl(var(--status-todo))',
    'In Uitvoering': 'hsl(var(--status-inprogress))',
    'Voltooid': 'hsl(var(--status-completed))',
    'Geannuleerd': 'hsl(var(--status-cancelled))',
    'Gearchiveerd': 'hsl(var(--status-archived))',
    // Priority
    'Urgent': 'hsl(var(--chart-1))',
    'Hoog': 'hsl(var(--chart-2))',
    'Midden': 'hsl(var(--chart-3))',
    'Laag': 'hsl(var(--chart-4))',
};

type DashboardViewProps = {
  tasks: Task[];
  users: User[];
  activityFeedItems: ActivityFeedItem[];
  isFeedLoading: boolean;
  setViewedTask: (task: Task | null) => void;
  navigateToUserProfile: (userId: string) => void;
};

export default function DashboardView({ tasks, users, activityFeedItems, isFeedLoading, setViewedTask, navigateToUserProfile }: DashboardViewProps) {
  const { resolvedTheme } = useTheme();

  const tasksByStatus = useMemo(() => {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<Status, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: COLORS[name] }));
  }, [tasks]);

  const tasksByPriority = useMemo(() => {
    const priorityCounts = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
    }, {} as Record<Priority, number>);
    
    return Object.entries(priorityCounts).map(([name, value]) => ({ name, value, fill: COLORS[name] }));
  }, [tasks]);

  const pointsPerUser = useMemo(() => {
    const lightness = resolvedTheme === 'dark' ? 60 : 45;
    return users.map(user => ({
      name: user.name,
      points: user.points,
      fill: `hsl(${user.id.charCodeAt(0) % 360}, 70%, ${lightness}%)`
    })).sort((a,b) => b.points - a.points);
  }, [users, resolvedTheme]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taak Status</CardTitle>
            <CardDescription>Distributie van taken per status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Scorebord</CardTitle>
            <CardDescription>Totaal aantal punten per gebruiker.</CardDescription>
          </CardHeader>
          <CardContent>
              <ChartContainer config={{}} className="h-[250px] w-full">
                  <ResponsiveContainer>
                      <BarChart data={pointsPerUser} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" dataKey="points" />
                          <YAxis type="category" dataKey="name" width={60} tickLine={false} axisLine={false} />
                          <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                          <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                              {pointsPerUser.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Prioriteit Distributie</CardTitle>
            <CardDescription>Hoe taken zijn verdeeld op basis van prioriteit.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={tasksByPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        {isFeedLoading ? <ActivityFeedSkeleton /> : <ActivityFeed items={activityFeedItems} users={users} tasks={tasks} setViewedTask={setViewedTask} navigateToUserProfile={navigateToUserProfile} />}
      </div>
    </div>
  );
}
