
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CircleDollarSign, BarChart, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { getCostAnalysisData, type CostAnalysisData } from '@/app/actions/analytics.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from 'next-themes';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils/utils';

export default function CostAnalysisPage() {
    const { projects, currentOrganization, loading } = useAuth();
    const { resolvedTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [result, setResult] = useState<CostAnalysisData | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedProject) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const { data, error: fetchError } = await getCostAnalysisData({
              projectId: selectedProject.id,
              organizationId: currentOrganization.id
            });
            if (fetchError) throw new Error(fetchError);
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        }

        setIsLoading(false);
    };

    const budgetTypeLabel = selectedProject?.budgetType === 'hours' ? 'uur' : '€';
    const budgetTypePrefix = selectedProject?.budgetType === 'amount' ? '€' : '';
    
    const chartColor = resolvedTheme === 'dark' ? '#a78bfa' : '#7c3aed'; // purple-400 / purple-600

    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><CircleDollarSign /> Kostenanalyse</h1>
                <p className="text-muted-foreground">Krijg inzicht in de kosten en budgetten van uw projecten.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Analyseer Projectkosten</CardTitle>
                    <CardDescription>Selecteer een project om de kosten te analyseren.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                     <div className="grid gap-2 flex-1">
                        <label className="font-medium text-sm">Project</label>
                        <Select
                          value={selectedProject?.id}
                          onValueChange={(projectId) => {
                            const project = projects.find(p => p.id === projectId) || null;
                            setSelectedProject(project);
                            setResult(null); // Clear previous results
                          }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecteer een project..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.filter(p => p.budget).map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAnalysis} disabled={isLoading || !selectedProject}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                        Analyseer Kosten
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Er is een fout opgetreden</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && selectedProject && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Totaal Budget</CardTitle>
                                <CircleDollarSign className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{budgetTypePrefix}{result.totalBudget.toLocaleString()} {budgetTypeLabel}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Totaal Besteed</CardTitle>
                                <CircleDollarSign className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{budgetTypePrefix}{result.totalCost.toLocaleString()} {budgetTypeLabel}</div>
                            </CardContent>
                        </Card>
                        <Card className={cn(result.remainingBudget < 0 && 'bg-destructive/10 border-destructive')}>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resterend Budget</CardTitle>
                                {result.remainingBudget < 0 ? <AlertTriangle className="h-4 w-4 text-destructive"/> : <TrendingUp className="h-4 w-4 text-muted-foreground"/>}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{budgetTypePrefix}{result.remainingBudget.toLocaleString()} {budgetTypeLabel}</div>
                                <p className="text-xs text-muted-foreground">{result.budgetProgress.toFixed(1)}% van budget gebruikt</p>
                            </CardContent>
                        </Card>
                    </div>
                     <Progress value={result.budgetProgress > 100 ? 100 : result.budgetProgress} className={cn(result.budgetProgress > 100 && '[&>div]:bg-destructive')} />

                     <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users /> Kosten per Teamlid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={result.costByMember} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" dataKey="cost" unit={budgetTypeLabel} />
                                        <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value) => `${budgetTypePrefix}${Number(value).toLocaleString()}`} />
                                        <Bar dataKey="cost" name="Kosten" fill={chartColor} radius={[0, 4, 4, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 10 Duurste Taken</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Taak</TableHead>
                                            <TableHead className="text-right">Kosten</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.costByTask.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium truncate max-w-xs">{task.title}</TableCell>
                                                <TableCell className="text-right">{budgetTypePrefix}{task.cost.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                     </div>
                </div>
            )}
        </div>
    );
}
