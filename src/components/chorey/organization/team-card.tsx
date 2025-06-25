'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, X, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Team, User } from '@/lib/types';
import { cn } from '@/lib/utils';

function ManageMembersPopover({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const usersInTeam = useMemo(() => usersInOrg.filter(u => team.memberIds.includes(u.id)), [usersInOrg, team.memberIds]);
    const usersNotInTeam = useMemo(() => usersInOrg.filter(u => !team.memberIds.includes(u.id)), [usersInOrg, team.memberIds]);

    const addUser = async (userId: string) => {
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
        const teamRef = doc(db, 'teams', team.id);
        try {
            await updateDoc(teamRef, { memberIds: arrayRemove(userId) });
            const user = usersInOrg.find(u => u.id === userId);
            toast({ title: 'Lid Verwijderd', description: `${user?.name} is verwijderd van team ${team.name}.`, variant: 'destructive' });
        } catch (error: any) {
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Leden beheren</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Command>
                    <CommandInput placeholder="Zoek gebruiker..." />
                    <CommandList>
                        <CommandEmpty>Geen gebruikers gevonden.</CommandEmpty>
                        {usersInTeam.length > 0 && (
                            <CommandGroup heading="Huidige Leden">
                                {usersInTeam.map(user => (
                                    <CommandItem key={user.id} onSelect={() => removeUser(user.id)} onMouseDown={handleMouseDown} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                        <X className="h-4 w-4 text-muted-foreground group-aria-selected:text-destructive" />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                         {usersNotInTeam.length > 0 && (
                            <CommandGroup heading="Voeg Leden Toe">
                                {usersNotInTeam.map(user => (
                                    <CommandItem key={user.id} onSelect={() => addUser(user.id)} onMouseDown={handleMouseDown}>
                                        <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
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

export function TeamCard({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const members = useMemo(() => {
        return team.memberIds.map(id => usersInOrg.find(u => u.id === id)).filter(Boolean) as User[];
    }, [team.memberIds, usersInOrg]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>{team.name}</CardTitle>
                    <CardDescription>{members.length} {members.length === 1 ? 'lid' : 'leden'}</CardDescription>
                </div>
                <ManageMembersPopover team={team} usersInOrg={usersInOrg} />
            </CardHeader>
            <CardContent>
                {members.length > 0 ? (
                    <TooltipProvider>
                        <div className="flex -space-x-2">
                            {members.map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="border-2 border-background">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                ) : (
                    <p className="text-sm text-muted-foreground">Dit team heeft nog geen leden.</p>
                )}
            </CardContent>
        </Card>
    );
}
