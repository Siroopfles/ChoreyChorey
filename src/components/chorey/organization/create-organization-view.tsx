'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { runTransaction, doc, collection, arrayUnion } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

const orgCreationSchema = z.object({
  name: z.string().min(3, 'Naam moet minimaal 3 karakters bevatten.'),
});
type OrgCreationFormValues = z.infer<typeof orgCreationSchema>;

export function CreateOrganizationView() {
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
            await runTransaction(db, async (transaction) => {
                const newOrgRef = doc(collection(db, 'organizations'));
                const userRef = doc(db, 'users', user.id);
                
                const newOrgData: Omit<Organization, 'id'> = {
                    name: data.name,
                    ownerId: user.id,
                    members: {
                        [user.id]: { role: 'Owner' }
                    },
                };
                transaction.set(newOrgRef, newOrgData);
                
                transaction.update(userRef, {
                    organizationIds: arrayUnion(newOrgRef.id),
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
