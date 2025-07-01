
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, BrainCircuit } from 'lucide-react';
import { suggestHeadcount } from '@/ai/flows/assistance-suggestion/suggest-headcount-flow';
import type { SuggestHeadcountOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function HeadcountPage() {
    const { currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [projectDescription, setProjectDescription] = useState('');
    const [result, setResult] = useState<SuggestHeadcountOutput | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization || !projectDescription.trim()) return;

        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const headcountResult = await suggestHeadcount(currentOrganization.id, projectDescription);
            setResult(headcountResult);
        } catch (e: any) {
            setError(e.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Users /> Headcount Planner</h1>
                <p className="text-muted-foreground">Laat AI een optimale teamsamenstelling en personeelsbehoefte voorstellen op basis van uw projectomschrijving.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Projectomschrijving</CardTitle>
                    <CardDescription>Voer een gedetailleerde omschrijving van uw project in. Hoe meer details, hoe beter het advies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Beschrijf hier het project, de doelen, de belangrijkste deliverables en de verwachte complexiteit..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="min-h-[150px]"
                    />
                    <Button onClick={handleAnalysis} disabled={isLoading || !projectDescription.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Analyseer & Plan
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Analyse</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{result.reasoning}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users /> Voorgestelde Teamsamenstelling</CardTitle>
                            <CardDescription>Totaal aanbevolen personeel: {result.totalHeadcount}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Aantal</TableHead>
                                        <TableHead>Aanbevolen Vaardigheden</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.suggestedRoles.map((role, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{role.role}</TableCell>
                                            <TableCell>{role.count}</TableCell>
                                            <TableCell>
                                                {role.skills && role.skills.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {role.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
