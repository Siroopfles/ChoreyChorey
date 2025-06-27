
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowRight, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { reassignTasks } from '@/app/actions/organization.actions';

export function ReassignTasksCard() {
    const { currentOrganization, user: currentUser } = useAuth();
    const { users } = useTasks();
    const { toast } = useToast();

    const [fromUserId, setFromUserId] = useState<string | undefined>(undefined);
    const [toUserId, setToUserId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    
    if (!currentOrganization || !currentUser) return null;

    const fromUser = users.find(u => u.id === fromUserId);
    const toUser = users.find(u => u.id === toUserId);

    const handleReassign = async () => {
        if (!fromUserId || !toUserId) {
            toast({ title: 'Selecteer gebruikers', description: 'Selecteer alstublieft beide gebruikers.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        const result = await reassignTasks(currentOrganization.id, fromUserId, toUserId, currentUser.id);
        setIsLoading(false);

        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Succes!', description: result.message });
            setFromUserId(undefined);
            setToUserId(undefined);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Vervanging</CardTitle>
                <CardDescription>Wijs alle taken van de ene gebruiker snel opnieuw toe aan een andere gebruiker.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Van</label>
                        <Select value={fromUserId} onValueChange={setFromUserId}>
                            <SelectTrigger><SelectValue placeholder="Selecteer gebruiker..." /></SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ArrowRight className="h-5 w-5 mt-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                        <label className="text-sm font-medium">Naar</label>
                         <Select value={toUserId} onValueChange={setToUserId}>
                            <SelectTrigger><SelectValue placeholder="Selecteer gebruiker..." /></SelectTrigger>
                            <SelectContent>
                                {users.filter(u => u.id !== fromUserId).map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={!fromUserId || !toUserId || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                            Taken Opnieuw Toewijzen
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                            <AlertDialogDescription>
                                U staat op het punt alle taken van **{fromUser?.name}** opnieuw toe te wijzen aan **{toUser?.name}**. Deze actie kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReassign}>Doorgaan</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
