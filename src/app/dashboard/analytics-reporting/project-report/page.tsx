
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardList, Bot, FileDown } from 'lucide-react';
import { generateProjectReport } from '@/ai/flows/reporting-insights/generate-project-report-flow';
import type { GenerateProjectReportOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useOrganization } from '@/contexts/system/organization-context';

export default function ProjectReportPage() {
    const { projects, loading: orgLoading } = useOrganization();
    const { currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [result, setResult] = useState<GenerateProjectReportOutput | null>(null);
    const [error, setError] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);

    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedProject) return;
        
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const reportResult = await generateProjectReport({
                projectId: selectedProject.id,
                projectName: selectedProject.name,
                organizationId: currentOrganization.id
            });
            setResult(reportResult);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    const handleExport = async () => {
        if (!reportRef.current || !selectedProject) return;
        setIsExporting(true);
        
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Improve quality
                backgroundColor: null, // Use transparent background
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            let newWidth = pdfWidth - 20; // with some margin
            let newHeight = newWidth / ratio;
            
            if (newHeight > pdfHeight - 20) {
              newHeight = pdfHeight - 20;
              newWidth = newHeight * ratio;
            }

            const x = (pdfWidth - newWidth) / 2;
            const y = 10;

            pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
            pdf.save(`Rapport-${selectedProject.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (e: any) {
            console.error(e);
            setError('Fout bij het exporteren van de PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    if (orgLoading) {
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Rapport voor: {selectedProject?.name}</CardTitle>
                         <Button onClick={handleExport} disabled={isExporting} variant="outline">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            Exporteer als PDF
                        </Button>
                    </CardHeader>
                    <CardContent ref={reportRef} className="bg-card text-card-foreground p-6">
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.report.replace(/\n/g, '<br />') }} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
