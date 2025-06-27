'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateGoogleAuthUrl, disconnectGoogleCalendar } from '@/app/actions/user.actions';
import { useSearchParams } from 'next/navigation';

export default function GoogleCalendarSettings() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        const success = searchParams.get('success');
        if (error) {
            toast({ title: 'Google Calendar Fout', description: 'Kon niet verbinden met Google Calendar.', variant: 'destructive' });
        }
        if (success === 'google_connected') {
            toast({ title: 'Verbonden!', description: 'Succesvol verbonden met Google Calendar.' });
        }
    }, [searchParams, toast]);
    
    if (!user) {
        return null;
    }

    const isConnected = !!user.googleRefreshToken;

    const handleConnect = async () => {
        setIsLoading(true);
        const result = await generateGoogleAuthUrl(user.id);
        if (result.url) {
            window.location.href = result.url;
        } else {
            toast({ title: 'Fout', description: 'Kon de Google authenticatie URL niet genereren.', variant: 'destructive' });
            setIsLoading(false);
        }
    };
    
    const handleDisconnect = async () => {
        setIsLoading(true);
        const result = await disconnectGoogleCalendar(user.id);
        if (result.error) {
             toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            await refreshUser();
            toast({ title: 'Verbinding verbroken' });
        }
        setIsLoading(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar/>Google Calendar Integratie</CardTitle>
                <CardDescription>Synchroniseer taken met een einddatum automatisch naar uw primaire Google Calendar.</CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-md">
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                            <CheckCircle className="h-5 w-5"/>
                            <span>Verbonden met Google Calendar</span>
                        </div>
                        <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Verbinding verbreken
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnect} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verbinden met Google Calendar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
