

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Team, User } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/lib/types';


export function ManageMembersPopover({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const { toast } = useToast();
    const { currentUserPermissions } = useAuth();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const canManage = currentUserPermissions.includes(PERMISSIONS.MANAGE_TEAMS);

    const usersInTeam = usersInOrg.filter(u => team.memberIds.includes(u.id));
    const usersNotInTeam = usersInOrg.filter(u => !team.memberIds.includes(u.id));

    const addUser = async (userId: string) => {
        if (!canManage) return;
        const teamRef = doc(db, 'teams', team.id);
        try {
            await updateDoc(teamRef, { memberIds: arrayUnion(userId) });
            const user = usersInOrg.find(u => u.id === userId);
            toast({ title: 'Lid Toegevoegd', description: `${user?.name} is toegevoegd aan team ${team.name}.` });
        } catch (error: any) {
             toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
    };

    const removeUser = async (userId: string) => {
        if (!canManage) return;
        const teamRef = doc(db, 'teams', team.id);
        try {
            await updateDoc(teamRef, { memberIds: arrayRemove(userId) });
            const user = usersInOrg.find(u => u.id === userId);
            toast({ title: 'Lid Verwijderd', description: `${user?.name} is verwijderd van team ${team.name}.`, variant: 'destructive' });
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={!canManage}><UserPlus className="mr-2 h-4 w-4" /> Leden beheren</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Command>
                    <CommandInput placeholder="Zoek gebruiker..." />
                    <CommandList>
                        <CommandEmpty>Geen gebruikers gevonden.</CommandEmpty>
                        {usersInTeam.length > 0 && (
                            <CommandGroup heading="Huidige Leden">
                                {usersInTeam.map(user => (
                                    <CommandItem key={user.id} onSelect={(e) => e.preventDefault()} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={() => router.push(`/dashboard/profile/${user.id}`)}>
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeUser(user.id)}
                                            aria-label={`Verwijder ${user.name}`}
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                         {usersNotInTeam.length > 0 && (
                            <CommandGroup heading="Voeg Leden Toe">
                                {usersNotInTeam.map(user => (
                                    <CommandItem key={user.id} onSelect={(e) => e.preventDefault()} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={() => router.push(`/dashboard/profile/${user.id}`)}>
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => addUser(user.id)}
                                            aria-label={`Voeg ${user.name} toe`}
                                        >
                                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
