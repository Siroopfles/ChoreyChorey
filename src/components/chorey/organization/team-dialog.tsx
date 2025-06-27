
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import type { Team } from '@/lib/types';
import { Globe } from 'lucide-react';

const teamSchema = z.object({
    name: z.string().min(2, 'Teamnaam moet minimaal 2 karakters bevatten.'),
    program: z.string().optional(),
    isSensitive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
});
type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamDialogProps {
  organizationId: string;
  team?: Team;
  children: ReactNode;
}

export function TeamDialog({ organizationId, team, children }: TeamDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: { name: '', program: '', isSensitive: false, isPublic: false },
    });
    
    useEffect(() => {
        if (team) {
            form.reset(team);
        } else {
            form.reset({ name: '', program: '', isSensitive: false, isPublic: false });
        }
    }, [team, open, form]);

    const onSubmit = async (data: TeamFormValues) => {
        setIsSubmitting(true);
        try {
            if (team) {
                // Editing existing team
                const teamRef = doc(db, 'teams', team.id);
                await updateDoc(teamRef, data);
                toast({ title: 'Gelukt!', description: `Team "${data.name}" is bijgewerkt.` });
            } else {
                // Creating new team
                await addDoc(collection(db, 'teams'), {
                    ...data,
                    organizationId,
                    memberIds: [],
                });
                toast({ title: 'Gelukt!', description: `Team "${data.name}" is aangemaakt.` });
            }
            setOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error saving team:", error);
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{team ? 'Team Bewerken' : 'Nieuw Team Aanmaken'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teamnaam</FormLabel>
                                    <FormControl><Input placeholder="bijv. Development" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="program"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programma (Optioneel)</FormLabel>
                                    <FormControl><Input placeholder="bijv. Product Innovatie" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isSensitive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Gevoelig Team</FormLabel>
                                    <FormDescription>
                                        Taken in dit team zijn enkel zichtbaar voor leden met speciale permissies.
                                    </FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPublic"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Publiek Zichtbaar</FormLabel>
                                    <FormDescription>
                                        Maak een read-only versie van dit team's bord deelbaar via een openbare link.
                                    </FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {team ? 'Wijzigingen Opslaan' : 'Team Aanmaken'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
