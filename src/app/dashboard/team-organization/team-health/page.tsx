'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert, User, Heart, AlertTriangle, CheckCircle, Activity, Lightbulb } from 'lucide-react';
import { predictBurnoutRisk } from '@/ai/flows/predict-burnout-risk-flow';
import type { PredictBurnoutRiskOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function TeamHealthPage() {
    const { users, currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [result, setResult] = useState<PredictBurnoutRiskOutput | null>(null);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!currentOrganization || !selectedUserId) return;
        
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser) return;

        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const riskResult = await predictBurnoutRisk(selectedUser.id, selectedUser.name, currentOrganization.id);
            setResult(riskResult);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    };
    
    const riskLevelConfig = {
        'Hoog': { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
        'Midden': { icon: Activity, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
        'Laag': { icon: Heart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
        'Geen': { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert /> Team Welzijn</h1>
                <p className="text-muted-foreground">Gebruik AI om proactief het welzijn van uw teamleden te bewaken en het risico op burn-out te identificeren.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Analyseer Burn-out Risico</CardTitle>
                    <CardDescription>Selecteer een teamlid om hun huidige werkdruk en patronen te analyseren op tekenen van overbelasting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                     <div className="grid gap-2 flex-1">
                        <label className="font-medium text-sm">Teamlid</label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecteer een teamlid..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAnalysis} disabled={isLoading || !selectedUserId}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                        Analyseer Risico
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
                    <Card className={cn(riskLevelConfig[result.riskLevel]?.bg)}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               {(() => {
                                 const Icon = riskLevelConfig[result.riskLevel]?.icon || Activity;
                                 return <Icon className={cn("h-6 w-6", riskLevelConfig[result.riskLevel]?.color)} />;
                               })()}
                               Risiconiveau: {result.riskLevel}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{result.reasoning}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb /> Voorgestelde Acties</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-2 pl-5">
                                {result.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
