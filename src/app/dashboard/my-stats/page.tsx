

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, Trophy, BarChart, ArrowLeft } from 'lucide-react';
import { getUserAnalytics } from '@/app/actions/user/user-analytics.actions';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { formatTime } from '@/lib/utils/time-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const dayLabels = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const hourLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

export default function MyStatsPage() {
  const { user, currentOrganization } = useAuth();
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getUserAnalytics>>['data']>(null);

  useEffect(() => {
    if (user && currentOrganization) {
      setLoading(true);
      getUserAnalytics(user.id, currentOrganization.id).then(result => {
        if (result.data) {
          setAnalytics(result.data);
        }
        setLoading(false);
      });
    }
  }, [user, currentOrganization]);

  const productivityByDay = useMemo(() => {
    if (!analytics) return [];
    return analytics.tasksByDay.map((count, index) => ({
      name: dayLabels[index],
      taken: count,
    }));
  }, [analytics]);

  const productivityByHour = useMemo(() => {
    if (!analytics) return [];
    return analytics.tasksByHour.map((count, index) => ({
      name: hourLabels[index],
      taken: count,
    }));
  }, [analytics]);

  const chartColor = resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb'; // blue-500

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
            <h3 className="text-2xl font-bold tracking-tight">Geen data beschikbaar</h3>
            <p className="text-sm text-muted-foreground">Kon uw productiviteitsinzichten niet laden.</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/settings/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug naar Profiel
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Mijn Productiviteitsinzichten</h1>
                <p className="text-muted-foreground">Een overzicht van uw activiteit in deze organisatie.</p>
            </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taken Voltooid</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalTasksCompleted.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tijd Geregistreerd</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatTime(analytics.totalTimeLogged)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verdiende Punten</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(user?.points || 0).toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart/>Productiviteit per Dag</CardTitle>
                    <CardDescription>Aantal voltooide taken per dag van de week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={productivityByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="taken" fill={chartColor} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart/>Productiviteit per Uur</CardTitle>
                    <CardDescription>Aantal voltooide taken per uur van de dag.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={productivityByHour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="taken" fill={chartColor} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
