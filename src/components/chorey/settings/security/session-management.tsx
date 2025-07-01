
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/user/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getUserSessions, terminateSession, terminateAllOtherSessions } from '@/app/actions/core/session.actions';
import type { Session } from '@/lib/types';
import { formatRelative } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SESSION_STORAGE_KEY = 'chorey_session_id';

const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
        return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    }
    return <Monitor className="h-5 w-5 text-muted-foreground" />;
}

export default function SessionManagement() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSessionId] = useLocalStorage(SESSION_STORAGE_KEY, '');
    
    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await getUserSessions(user.id);
        if (error) {
            toast({ title: 'Fout bij ophalen sessies', description: error, variant: 'destructive' });
        } else if (data) {
            setSessions(data.sessions);
        }
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleTerminate = async (sessionId: string) => {
        const { error } = await terminateSession(sessionId, currentSessionId);
        if (error) {
            toast({ title: 'Fout', description: error, variant: 'destructive' });
        } else {
            toast({ title: 'Sessie beëindigd' });
            fetchSessions();
        }
    };
    
    const handleTerminateAll = async () => {
        if (!user) return;
        const { data, error } = await terminateAllOtherSessions(user.id, currentSessionId);
        if (error) {
            toast({ title: 'Fout', description: error, variant: 'destructive' });
        } else if (data) {
            toast({ title: 'Sessies beëindigd', description: `${data.count} andere sessie(s) zijn beëindigd.` });
            fetchSessions();
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Actieve Sessies</CardTitle>
                    <CardDescription>Beheer uw actieve login-sessies op verschillende apparaten.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Actieve Sessies</CardTitle>
                        <CardDescription>Beheer uw actieve login-sessies op verschillende apparaten.</CardDescription>
                    </div>
                    {sessions.length > 1 && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="sm">Log Overal Uit</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Alle andere sessies beëindigen?</AlertDialogTitle>
                                    <AlertDialogDescription>U blijft ingelogd op dit apparaat, maar wordt op alle andere apparaten uitgelogd.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleTerminateAll} className="bg-destructive hover:bg-destructive/90">Doorgaan</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {sessions.map(session => (
                        <li key={session.id} className="flex items-center gap-4">
                            {getDeviceIcon(session.userAgent)}
                            <div className="flex-1">
                                <p className="font-medium">
                                    {session.userAgent.split(')')[0] + ')'} 
                                    {session.id === currentSessionId && <span className="text-primary font-bold ml-2">(Huidige sessie)</span>}
                                </p>
                                <p className="text-sm text-muted-foreground">Laatst actief: {formatRelative(session.lastAccessed, new Date(), { locale: nl })}</p>
                            </div>
                            {session.id !== currentSessionId && (
                                <Button variant="ghost" size="icon" onClick={() => handleTerminate(session.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
