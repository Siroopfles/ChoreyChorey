
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMicrosoftAuthUrl, disconnectMicrosoftCalendar, updateUserProfile } from '@/app/actions/user.actions';

const MicrosoftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" fill="currentColor" className="h-5 w-5">
        <path d="M1 1h10v10H1V1zm11 0h10v10H12V1zM1 12h10v10H1V12zm11 0h10v10H12V12z" />
    </svg>
);

export default function MicrosoftCalendarSettings() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    if (!user) {
        return null;
    }

    const isConnected = !!user.microsoftRefreshToken;

    const handleConnect = async () => {
        setIsLoading(true);
        const result = await generateMicrosoftAuthUrl(user.id);
        
        if (result.url) {
            const popup = window.open(result.url, 'microsoft-auth', 'width=600,height=700');
            
            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) {
                    return;
                }

                if (event.data.type === 'microsoft-auth-callback') {
                    if (event.data.success && event.data.refreshToken) {
                        const updateResult = await updateUserProfile(user.id, { microsoftRefreshToken: event.data.refreshToken });
                         if (updateResult.error) {
                            toast({ title: 'Fout bij opslaan token', description: updateResult.error, variant: 'destructive' });
                        } else {
                            toast({ title: 'Verbonden!', description: 'Succesvol verbonden met Outlook Calendar.' });
                            await refreshUser();
                        }
                    } else {
                        toast({ title: 'Outlook Calendar Fout', description: event.data.error || 'Kon niet verbinden met Outlook Calendar.', variant: 'destructive' });
                    }
                    setIsLoading(false);
                    window.removeEventListener('message', handleMessage);
                    popup?.close();
                }
            };
            
            window.addEventListener('message', handleMessage, false);
        } else {
            toast({ title: 'Fout', description: result.error || 'Kon de Microsoft authenticatie URL niet genereren.', variant: 'destructive' });
            setIsLoading(false);
        }
    };
    
    const handleDisconnect = async () => {
        setIsLoading(true);
        const result = await disconnectMicrosoftCalendar(user.id);
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
                <CardTitle className="flex items-center gap-2"><MicrosoftIcon/>Outlook Calendar Integratie</CardTitle>
                <CardDescription>Synchroniseer taken met een einddatum automatisch naar uw primaire Outlook Calendar.</CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-md">
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                            <CheckCircle className="h-5 w-5"/>
                            <span>Verbonden met Outlook Calendar</span>
                        </div>
                        <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Verbinding verbreken
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnect} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verbinden met Outlook Calendar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
