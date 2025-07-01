
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useTasks } from '@/contexts/feature/task-context';
import type { Task } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TrashPage() {
    const { loading: authLoading } = useAuth();
    const { tasks, loading: tasksLoading, updateTask, deleteTaskPermanently } = useTasks();
    const { toast } = useToast();

    const trashedTasks = useMemo(() => {
        return tasks
            .filter(task => task.status === 'Geannuleerd')
            .sort((a, b) => {
                const aCancelledEntry = a.history.find(h => h.action.includes('geannuleerd') || h.action.includes('Prullenbak'));
                const bCancelledEntry = b.history.find(h => h.action.includes('geannuleerd') || h.action.includes('Prullenbak'));
                return (bCancelledEntry?.timestamp.getTime() || 0) - (aCancelledEntry?.timestamp.getTime() || 0);
            });
    }, [tasks]);

    const handleRestore = (taskId: string) => {
        updateTask(taskId, { status: 'Te Doen' });
        toast({ title: "Taak Hersteld", description: "De taak is teruggezet naar de 'Te Doen' kolom." });
    };

    const handleDelete = (taskId: string) => {
        deleteTaskPermanently(taskId);
        toast({ title: "Taak Permanent Verwijderd", description: "De taak is permanent verwijderd.", variant: "destructive" });
    };
    
    if (authLoading || tasksLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold flex items-center gap-2"><Trash2 /> Prullenbak</h1>
                <p className="text-muted-foreground">Taken die hier worden weergegeven, zijn verplaatst naar de prullenbak.</p>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Automatische Verwijdering</AlertTitle>
                <AlertDescription>
                    Items in de prullenbak worden na 30 dagen automatisch permanent verwijderd.
                </AlertDescription>
            </Alert>
            
            {trashedTasks.length > 0 ? (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Taak</TableHead>
                                <TableHead>Verwijderd</TableHead>
                                <TableHead className="text-right">Acties</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trashedTasks.map(task => {
                                const lastCancelledEntry = task.history.filter(h => h.action.includes('geannuleerd') || h.action.includes('Prullenbak')).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
                                return (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {lastCancelledEntry ? formatDistanceToNow(lastCancelledEntry.timestamp, { addSuffix: true, locale: nl }) : 'Onbekend'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleRestore(task.id)}>
                                                <RotateCcw className="mr-2 h-4 w-4"/> Herstellen
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="mr-2 h-4 w-4"/> Permanent Verwijderen
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                                        <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt. De taak wordt permanent verwijderd.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
                    <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-bold tracking-tight">De prullenbak is leeg</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Verwijderde taken verschijnen hier.
                    </p>
                </div>
            )}
        </div>
    );
}
