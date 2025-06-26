
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Loader2, Save, Gamepad2, Database, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const featureSchema = z.object({
  gamification: z.boolean().default(true),
  storyPoints: z.boolean().default(true),
  timeTracking: z.boolean().default(true),
});
type FeatureFormValues = z.infer<typeof featureSchema>;

export default function FeatureToggleSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    values: {
      gamification: organization.settings?.features?.gamification ?? true,
      storyPoints: organization.settings?.features?.storyPoints ?? true,
      timeTracking: organization.settings?.features?.timeTracking ?? true,
    },
  });

  const onSubmit = async (data: FeatureFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        features: data
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Feature instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Toggles</CardTitle>
        <CardDescription>
          Schakel individuele modules aan of uit voor de hele organisatie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="gamification"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center gap-2"><Gamepad2/> Gamification</FormLabel>
                                    <p className="text-sm text-muted-foreground">Schakel het puntensysteem, scorebord en prestaties in of uit.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="storyPoints"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center gap-2"><Database/> Story Points</FormLabel>
                                     <p className="text-sm text-muted-foreground">Schakel het inschatten van complexiteit met Story Points in of uit.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="timeTracking"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center gap-2"><Timer/> Tijdregistratie</FormLabel>
                                     <p className="text-sm text-muted-foreground">Schakel de mogelijkheid om tijd te registreren op taken in of uit.</p>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Instellingen Opslaan
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
