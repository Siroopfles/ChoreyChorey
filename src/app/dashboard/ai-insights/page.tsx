'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, BrainCircuit, Bot, LineChart, Users, FileCheck, Brain } from 'lucide-react';
import { generateInsights } from '@/ai/flows/reporting-insights/generate-insights-flow';
import type { GenerateInsightsOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const categoryConfig = {
    'Productivity': { icon: LineChart, color: 'text-green-600 dark:text-green-400' },
    'Workflow': { icon: FileCheck, color: 'text-blue-600 dark:text-blue-400' },
    'Team Dynamics': { icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    'Planning & Estimation': { icon: Brain, color: 'text-orange-600 dark:text-orange-400' },
    'Data Quality': { icon: Brain, color: 'text-yellow-600 dark:text-yellow-400' },
    'Data': { icon: Brain, color: 'text-gray-600 dark:text-gray-400' },
};

export default function AiInsightsPage() {
    const { currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<GenerateInsightsOutput | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const insights = await generateInsights({
              organizationId: currentOrganization.id
            });
            setResult(insights);
        } catch (e: any) {
            setError(e.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit /> AI Inzichten & Trends</h1>
                <p className="text-muted-foreground">Laat de AI uw organisatiegegevens analyseren om verborgen patronen en bruikbare inzichten te ontdekken.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genereer Organisatie-inzichten</CardTitle>
                    <CardDescription>Klik op de knop om de AI een analyse te laten uitvoeren. Dit kan even duren, afhankelijk van de hoeveelheid data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAnalysis} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Analyseer Nu
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Er is een fout opgetreden</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.insights.map((insight, index) => {
                        const config = categoryConfig[insight.category] || categoryConfig['Productivity'];
                        const Icon = config.icon;
                        return (
                            <Card key={index} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className={`flex items-start gap-3 ${config.color}`}>
                                        <Icon className="h-6 w-6 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wider">{insight.category}</p>
                                            <p className="text-lg leading-tight text-card-foreground">{insight.title}</p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{insight.finding}</p>
                                </CardContent>
                                <CardFooter>
                                     <p className="text-xs text-muted-foreground border-t pt-2 w-full">
                                        <span className="font-semibold">Bewijs:</span> {insight.evidence}
                                     </p>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
