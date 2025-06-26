
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

const teamSchema = z.object({
    name: z.string().min(2, 'Teamnaam moet minimaal 2 karakters bevatten.'),
    program: z.string().optional(),
});
type TeamFormValues = z.infer<typeof teamSchema>;

export function CreateTeamDialog({ organizationId }: { organizationId: string }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: { name: '', program: '' },
    });

    const onSubmit = async (data: TeamFormValues) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'teams'), {
                name: data.name,
                program: data.program || null,
                organizationId,
                memberIds: [],
            });
            toast({ title: 'Gelukt!', description: `Team "${data.name}" is aangemaakt.` });
            setOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error creating team:", error);
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
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
                         <FormField
                            control={form.control}
                            name="program"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programma (Optioneel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="bijv. Product Innovatie" {...field} />
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
