'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BrainCircuit, Lightbulb, TrendingUp, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { analyzeWhatIfScenario } from '@/ai/flows/risk-prediction/what-if-scenario-flow';
import type { WhatIfScenarioOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

export default function ScenarioPlannerPage() {
    const { currentOrganization, loading: authLoading } = useAuth();
    const { projects, loading: orgLoading } = useOrganization();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [scenario, setScenario] = useState('');
    const [result, setResult] = useState<WhatIfScenarioOutput | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedProject || !scenario.trim()) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const outcome = await analyzeWhatIfScenario({
                projectId: selectedProject.id,
                organizationId: currentOrganization.id,
                scenarioDescription: scenario,
            });
            setResult(outcome);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    if (authLoading || orgLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit /> Scenario Planner (AI)</h1>
                <p className="text-muted-foreground">Stel 'wat-als' vragen over uw projecten en laat de AI de impact analyseren.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stel uw Scenario op</CardTitle>
                    <CardDescription>Selecteer een project en beschrijf uw scenario in natuurlijke taal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <label className="font-medium text-sm">1. Selecteer een Project</label>
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
                     <div className="grid gap-2">
                        <label className="font-medium text-sm">2. Beschrijf het Scenario</label>
                        <Textarea
                            placeholder="bv. Wat gebeurt er als de API ontwikkeling 2 weken vertraging oploopt? of Wat is de impact als we een extra part-time designer toevoegen?"
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <Button onClick={handleAnalysis} disabled={isLoading || !selectedProject || !scenario.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Analyseer Scenario
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
                <Card>
                    <CardHeader>
                        <CardTitle>Analyse Resultaten</CardTitle>
                        <CardDescription>{result.impactSummary}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid gap-6 md:grid-cols-2">
                            <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                    <div className="p-2 bg-primary/10 rounded-full"><TrendingUp className="h-5 w-5 text-primary"/></div>
                                    <CardTitle className="text-base">Tijdlijn Impact</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl font-bold">{result.predictedCompletionDateChange}</p>
                                    <p className="text-sm text-muted-foreground">Nieuwe voorspelde einddatum: {result.newPredictedCompletionDate}</p>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                    <div className="p-2 bg-primary/10 rounded-full"><CircleDollarSign className="h-5 w-5 text-primary"/></div>
                                    <CardTitle className="text-base">Budget Impact</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl font-bold">{result.budgetImpact}</p>
                                </CardContent>
                            </Card>
                         </div>
                         <div>
                            <h4 className="font-semibold mb-2">Analyse & Redenering</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.reasoning}</p>
                         </div>
                         <Separator />
                         <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb /> Aanbevelingen</h4>
                             <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                {result.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                         </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
