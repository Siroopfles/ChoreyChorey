
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, UserPlus, X, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleCreateTeam, handleAddUserToTeam, handleRemoveUserFromTeam } from '@/app/actions';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, runTransaction, doc } from 'firebase/firestore';
import type { Team, User, Organization } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const orgCreationSchema = z.object({
  name: z.string().min(3, 'Naam moet minimaal 3 karakters bevatten.'),
});
type OrgCreationFormValues = z.infer<typeof orgCreationSchema>;

const teamSchema = z.object({
    name: z.string().min(2, 'Teamnaam moet minimaal 2 karakters bevatten.'),
});
type TeamFormValues = z.infer<typeof teamSchema>;

function CreateOrganizationView() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<OrgCreationFormValues>({
        resolver: zodResolver(orgCreationSchema),
        defaultValues: { name: '' },
    });

    const onSubmit = async (data: OrgCreationFormValues) => {
        if (!user) {
            toast({ title: 'Fout', description: 'Je moet ingelogd zijn om een organisatie aan te maken.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        
        try {
            const newOrgRef = doc(collection(db, 'organizations'));
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.id);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("Gebruikersdocument niet gevonden! Kan organisatie niet aanmaken.");
                }

                const newOrgData: Omit<Organization, 'id'> = {
                    name: data.name,
                    ownerId: user.id,
                };
                transaction.set(newOrgRef, newOrgData);
                
                const currentOrgIds = userDoc.data().organizationIds || [];
                const newOrgIds = [...currentOrgIds, newOrgRef.id];

                transaction.update(userRef, {
                    organizationIds: newOrgIds,
                    currentOrganizationId: newOrgRef.id
                });
            });
            toast({ title: 'Gelukt!', description: `Organisatie "${data.name}" is aangemaakt.` });
            await refreshUser();
        } catch (error: any) {
            console.error("Error creating organization:", error);
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Maak je eerste organisatie</CardTitle>
                    <CardDescription>Om Chorey te gebruiken, moet je lid zijn van een organisatie. Maak er nu een aan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Naam van de organisatie</FormLabel>
                                        <FormControl>
                                            <Input placeholder="bijv. Mijn Familie" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Organisatie Aanmaken
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    );
}

function CreateTeamDialog({ organizationId }: { organizationId: string }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: { name: '' },
    });

    const onSubmit = async (data: TeamFormValues) => {
        setIsSubmitting(true);
        const result = await handleCreateTeam(data.name, organizationId);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Gelukt!', description: `Team "${data.name}" is aangemaakt.` });
            setOpen(false);
            form.reset();
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuw Team
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nieuw Team Aanmaken</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teamnaam</FormLabel>
                                    <FormControl>
                                        <Input placeholder="bijv. Development" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Annuleren</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Team Aanmaken
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ManageMembersPopover({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const usersInTeam = useMemo(() => usersInOrg.filter(u => team.memberIds.includes(u.id)), [usersInOrg, team.memberIds]);
    const usersNotInTeam = useMemo(() => usersInOrg.filter(u => !team.memberIds.includes(u.id)), [usersInOrg, team.memberIds]);

    const addUser = async (userId: string) => {
        const result = await handleAddUserToTeam(team.id, userId);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            const user = usersInOrg.find(u => u.id === userId);
            toast({ title: 'Lid Toegevoegd', description: `${user?.name} is toegevoegd aan team ${team.name}.` });
        }
    };

    const removeUser = async (userId: string) => {
        const result = await handleRemoveUserFromTeam(team.id, userId);
        if (result.error) {
            toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        } else {
            const user = usersInOrg.find(u => u.id === userId);
            toast({ title: 'Lid Verwijderd', description: `${user?.name} is verwijderd van team ${team.name}.`, variant: 'destructive' });
        }
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
                                    <CommandItem key={user.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeUser(user.id)}>
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                         {usersNotInTeam.length > 0 && (
                            <CommandGroup heading="Voeg Leden Toe">
                                {usersNotInTeam.map(user => (
                                    <CommandItem key={user.id} onSelect={() => addUser(user.id)}>
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

function TeamCard({ team, usersInOrg }: { team: Team, usersInOrg: User[] }) {
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


export default function OrganizationPage() {
    const { currentOrganization, loading: authLoading } = useAuth();
    const { users: usersInOrg } = useTasks();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentOrganization) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, "teams"), where("organizationId", "==", currentOrganization.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentOrganization]);
    
    if (authLoading) {
        return (
          <div className="flex h-screen w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    if (!currentOrganization) {
        return <CreateOrganizationView />;
    }

    if (loading) {
         return (
          <div className="flex h-screen w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-lg md:text-2xl">Team Beheer voor {currentOrganization.name}</h1>
                <CreateTeamDialog organizationId={currentOrganization.id} />
            </div>

            <Separator />
            
            {teams.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map(team => (
                        <TeamCard key={team.id} team={team} usersInOrg={usersInOrg} />
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center py-12">
                    <CardHeader className="text-center">
                        <CardTitle>Nog geen teams</CardTitle>
                        <CardDescription>Maak je eerste team aan om leden te organiseren.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateTeamDialog organizationId={currentOrganization.id} />
                    </CardContent>
                </Card>
            )}
        </main>
    );
}

    