
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, BrainCircuit, Bot, AlertTriangle, CheckCircle, TrendingUp, CircleDollarSign, Lightbulb, HeartPulse } from 'lucide-react';
import { predictProjectOutcome } from '@/ai/flows/predict-project-outcome-flow';
import type { PredictProjectOutcomeOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';

export default function ProjectHealthPage() {
    const { projects, currentOrganization, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [result, setResult] = useState<PredictProjectOutcomeOutput | null>(null);
    const [error, setError] = useState('');
    
    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedProject) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const outcome = await predictProjectOutcome({
              projectId: selectedProject.id,
              organizationId: currentOrganization.id
            });
            setResult(outcome);
        } catch (e: any) {
            setError(e.message);
        }

        setIsLoading(false);
    };

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

    const getHealthScoreColor = (score: number) => {
        if (score > 75) return 'text-green-600 dark:text-green-400';
        if (score > 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-destructive';
    };

    const statusConfig = {
        'ON_TRACK': { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', label: 'Op Schema' },
        'AT_RISK': { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', label: 'Risico' },
        'OFF_TRACK': { icon: AlertTriangle, color: 'text-destructive', label: 'Uit Schema' },
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><HeartPulse /> Project Gezondheid & Voorspelling</h1>
                <p className="text-muted-foreground">Bereken een gezondheidsscore en krijg een voorspelling over de uitkomst van uw projecten.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genereer Analyse</CardTitle>
                    <CardDescription>Selecteer een project om een gezondheidsscore voor op te stellen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                     <div className="grid gap-2 flex-1">
                        <label className="font-medium text-sm">Project</label>
                        <Select
                          value={selectedProject?.id}
                          onValueChange={(projectId) => {
                            const project = projects.find(p => p.id === projectId) || null;
                            setSelectedProject(project);
                          }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecteer een project..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAnalysis} disabled={isLoading || !selectedProject}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Analyseer Project
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Er is een fout opgetreden</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                   Gezondheidsscore
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className={cn("text-6xl font-bold tracking-tighter", getHealthScoreColor(result.confidenceScore))}>{result.confidenceScore}</p>
                                <p className="text-muted-foreground">/ 100</p>
                            </CardContent>
                             <CardFooter>
                                <Progress value={result.confidenceScore} className="h-2" />
                             </CardFooter>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                   Voorspellingen
                                </CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    {(() => {
                                        const Icon = statusConfig[result.onTrackStatus]?.icon || TrendingUp;
                                        const color = statusConfig[result.onTrackStatus]?.color || 'text-foreground';
                                        return <Icon className={cn("h-5 w-5 mt-1 shrink-0", color)} />;
                                    })()}
                                    <div>
                                        <p className="font-semibold">Status</p>
                                        <p className="text-lg">{statusConfig[result.onTrackStatus]?.label}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 shrink-0"/>
                                    <div>
                                        <p className="font-semibold">Verwachte voltooiing</p>
                                        <p className="text-lg font-bold">{format(new Date(result.predictedCompletionDate), 'dd MMM yyyy')}</p>
                                        {selectedProject?.deadline && <p className="text-xs text-muted-foreground">Oorspronkelijke deadline: {format(new Date(selectedProject.deadline), 'dd MMM yyyy')}</p>}
                                    </div>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <CircleDollarSign className="h-5 w-5 mt-1 text-amber-500 shrink-0"/>
                                    <div>
                                        <p className="font-semibold">Budget</p>
                                        <p className="text-lg">{result.budgetPrediction}</p>
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                  Aanbevelingen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 list-disc pl-5">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm">{rec}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb /> AI Redenering</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{result.reasoning}</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
