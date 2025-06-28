

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
import { Loader2, Building, Users, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { runTransaction, doc, collection, arrayUnion } from 'firebase/firestore';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const orgCreationSchema = z.object({
  name: z.string().min(3, 'Naam moet minimaal 3 karakters bevatten.'),
});
type OrgCreationFormValues = z.infer<typeof orgCreationSchema>;

interface CreateOrganizationViewProps {
  onCreated?: () => void;
  inDialog?: boolean;
}

export function CreateOrganizationView({ onCreated, inDialog = false }: CreateOrganizationViewProps) {
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
                    dataResidency: 'US', // Default, as this is a simulated setting.
                    members: {
                        [user.id]: { role: 'Owner', hasCompletedOnboarding: false }
                    },
                    settings: {
                        customization: {
                            statuses: ['Te Doen', 'In Uitvoering', 'In Review', 'Voltooid', 'Geannuleerd'],
                            labels: ['Keuken', 'Woonkamer', 'Badkamer', 'Slaapkamer', 'Algemeen', 'Kantoor'],
                            priorities: ['Laag', 'Midden', 'Hoog', 'Urgent'],
                        },
                        features: {
                            gamification: true,
                            storyPoints: true,
                            timeTracking: true,
                        }
                    }
                };
                transaction.set(newOrgRef, newOrgData);
                
                transaction.update(userRef, {
                    organizationIds: arrayUnion(newOrgRef.id),
                    currentOrganizationId: newOrgRef.id
                });
            });
            toast({ title: 'Gelukt!', description: `Organisatie "${data.name}" is aangemaakt.` });
            await refreshUser();
            if (onCreated) {
              onCreated();
            }
        } catch (error: any) {
            console.error("Error creating organization:", error);
            toast({ title: 'Fout', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const Wrapper = inDialog ? 'div' : Card;
    const ContentWrapper = inDialog ? 'div' : CardContent;
    
    const viewContent = (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5"/> Maak een nieuwe organisatie</CardTitle>
          <CardDescription>Geef je werkruimte een naam, bijvoorbeeld "Mijn Familie" of "Marketing Team".</CardDescription>
        </CardHeader>
        <ContentWrapper>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Naam van de organisatie</FormLabel>
                              <FormControl>
                                  <Input placeholder="bijv. Ons Gezin" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="data-location">Data Locatie</Label>
                    <Select defaultValue="US" disabled>
                        <SelectTrigger id="data-location">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="US">Verenigde Staten (Standaard)</SelectItem>
                            <SelectItem value="EU">Europese Unie</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3 shrink-0" /> Echte data residency vereist het opzetten van een apart Firebase project in de gewenste regio.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Organisatie Aanmaken
                  </Button>
              </form>
          </Form>
        </ContentWrapper>
      </>
    );

    if (inDialog) {
      return viewContent;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welkom bij Chorey, {user?.name}!</h1>
            <p className="max-w-xl mt-2 text-lg text-muted-foreground">Laten we beginnen met het opzetten van je eerste organisatie.</p>
            <p className="max-w-xl mt-1 text-sm text-muted-foreground">
                Een organisatie is een werkruimte voor je team, familie of project. Hierin beheer je taken en leden.
            </p>

            <Wrapper className="w-full max-w-md mt-8 text-left">
              {viewContent}
            </Wrapper>

             <Alert className="w-full max-w-md mt-6 text-left">
                <Users className="h-4 w-4"/>
                <AlertTitle>Deelnemen aan een organisatie?</AlertTitle>
                <AlertDescription>
                   Als je bent uitgenodigd, gebruik dan de speciale link die je hebt ontvangen om lid te worden van een bestaande organisatie.
                </AlertDescription>
            </Alert>
        </div>
    );
}
