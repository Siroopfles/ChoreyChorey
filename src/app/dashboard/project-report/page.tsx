'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardList, Bot } from 'lucide-react';
import { handleGenerateProjectReport } from '@/app/actions/ai.actions';
import type { GenerateProjectReportOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectReportPage() {
    const { projects, currentOrganization, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [result, setResult] = useState<GenerateProjectReportOutput | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedProject) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        const response = await handleGenerateProjectReport(selectedProject.id, selectedProject.name, currentOrganization.id);

        if (response.error) {
            setError(response.error);
        } else if (response.result) {
            setResult(response.result);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><ClipboardList /> AI Project Rapportage</h1>
                <p className="text-muted-foreground">Laat de AI een gedetailleerd voortgangsrapport genereren voor een van uw projecten.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genereer Rapport</CardTitle>
                    <CardDescription>Selecteer een project om een rapport voor op te stellen.</CardDescription>
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
                        Genereer Rapport
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Er is een fout opgetreden</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result?.report && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rapport voor: {selectedProject?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.report.replace(/\n/g, '<br />') }} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
