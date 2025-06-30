'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailCheck, Calendar, Sun } from 'lucide-react';
import { generateNotificationDigest } from '@/ai/flows/notification-digest-flow';
import type { NotificationDigestInput } from '@/ai/schemas';

export default function DigestPage() {
    const { user, currentOrganization } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [digest, setDigest] = useState('');
    const [error, setError] = useState('');
    const [period, setPeriod] = useState<'daily' | 'weekly' | null>(null);

    const getDigest = async (requestedPeriod: 'daily' | 'weekly') => {
        if (!user || !currentOrganization) return;

        setIsLoading(true);
        setPeriod(requestedPeriod);
        setDigest('');
        setError('');
        
        try {
            const result = await generateNotificationDigest({
                userId: user.id,
                organizationId: currentOrganization.id,
                period: requestedPeriod,
            });
            setDigest(result);
        } catch (e: any) {
            setError(e.message);
        }
        
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><MailCheck /> Notificatie Overzicht</h1>
                <p className="text-muted-foreground">Laat AI een samenvatting maken van je recente meldingen.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genereer een overzicht</CardTitle>
                    <CardDescription>Kies de periode waarvoor je een samenvatting wilt ontvangen.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Button onClick={() => getDigest('daily')} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading && period === 'daily' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sun className="mr-2 h-4 w-4" />}
                        Dagelijks Overzicht
                    </Button>
                    <Button onClick={() => getDigest('weekly')} disabled={isLoading} variant="outline" className="w-full sm:w-auto">
                         {isLoading && period === 'weekly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                        Wekelijks Overzicht
                    </Button>
                </CardContent>
            </Card>

            {(digest || error) && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {error ? 'Er is een fout opgetreden' : `Je ${period === 'daily' ? 'dagelijkse' : 'wekelijkse'} overzicht`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <p className="text-destructive">{error}</p>
                        ) : (
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: digest.replace(/\n/g, '<br />') }} />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
