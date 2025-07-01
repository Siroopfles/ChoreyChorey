
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateGoogleAuthUrl, disconnectGoogleCalendar } from '@/app/actions/integrations/calendar.actions';
import { updateUserProfile } from '@/app/actions/user/user.actions';

export default function GoogleCalendarSettings() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    if (!user) {
        return null;
    }

    const isConnected = !!user.googleRefreshToken;

    const handleConnect = async () => {
        setIsLoading(true);
        const result = await generateGoogleAuthUrl(user.id);
        
        if (result.data?.url) {
            const popup = window.open(result.data.url, 'google-auth', 'width=600,height=700');
            
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) {
                    return;
                }

                if (event.data.type === 'google-auth-callback') {
                    if (event.data.success && event.data.refreshToken) {
                        const updateResult = await updateUserProfile(user.id, { googleRefreshToken: event.data.refreshToken });
                         if (updateResult.error) {
                            toast({ title: 'Fout bij opslaan token', description: updateResult.error, variant: 'destructive' });
                        } else {
                            toast({ title: 'Verbonden!', description: 'Succesvol verbonden met Google Calendar.' });
                            await refreshUser();
                        }
                    } else {
                        toast({ title: 'Google Calendar Fout', description: event.data.error || 'Kon niet verbinden met Google Calendar.', variant: 'destructive' });
                    }
                    setIsLoading(false);
                    window.removeEventListener('message', handleMessage);
                    popup?.close();
                }
            };
            
            window.addEventListener('message', handleMessage, false);
        } else {
            toast({ title: 'Fout', description: result.error || 'Kon de Google authenticatie URL niet genereren.', variant: 'destructive' });
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
