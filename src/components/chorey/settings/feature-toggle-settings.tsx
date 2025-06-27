
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
import { Loader2, Save, Gamepad2, Database, Timer, HeartHandshake, Trophy, Lightbulb, UserCheck, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const featureSchema = z.object({
  gamification: z.boolean().default(true),
  storyPoints: z.boolean().default(true),
  timeTracking: z.boolean().default(true),
  mentorship: z.boolean().default(true),
  goals: z.boolean().default(true),
  ideas: z.boolean().default(true),
  raci: z.boolean().default(true),
  publicSharing: z.boolean().default(true),
});
type FeatureFormValues = z.infer<typeof featureSchema>;

const FeatureToggle = ({ name, icon: Icon, label, description, control }: { name: keyof FeatureFormValues, icon: React.ElementType, label: string, description: string, control: any }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2"><Icon/> {label}</FormLabel>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
            </FormItem>
        )}
    />
);

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
      mentorship: organization.settings?.features?.mentorship ?? true,
      goals: organization.settings?.features?.goals ?? true,
      ideas: organization.settings?.features?.ideas ?? true,
      raci: organization.settings?.features?.raci ?? true,
      publicSharing: organization.settings?.features?.publicSharing ?? true,
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

  const features = [
      { name: 'gamification', icon: Gamepad2, label: 'Gamification', description: 'Schakel het puntensysteem, scorebord en prestaties in of uit.' },
      { name: 'storyPoints', icon: Database, label: 'Story Points', description: 'Schakel het inschatten van complexiteit met Story Points in of uit.' },
      { name: 'timeTracking', icon: Timer, label: 'Tijdregistratie', description: 'Schakel de mogelijkheid om tijd te registreren op taken in of uit.' },
      { name: 'goals', icon: Trophy, label: 'Doelen & Uitdagingen', description: 'Sta gebruikers toe persoonlijke doelen en teamuitdagingen te creëren.' },
      { name: 'ideas', icon: Lightbulb, label: 'Ideeënbus', description: 'Activeer de module voor het indienen en upvoten van ideeën.' },
      { name: 'mentorship', icon: HeartHandshake, label: 'Mentorschap', description: 'Activeer de mentorschapspagina waar gebruikers elkaar kunnen vinden.' },
      { name: 'raci', icon: UserCheck, label: 'RACI Matrix', description: 'Activeer de RACI-matrix voor een overzicht van verantwoordelijkheden.' },
      { name: 'publicSharing', icon: Globe, label: 'Publiek Delen', description: 'Sta toe dat projecten openbaar gedeeld kunnen worden via een link.' },
  ];

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
                    {features.map(feature => (
                        <FeatureToggle
                            key={feature.name}
                            name={feature.name as keyof FeatureFormValues}
                            icon={feature.icon}
                            label={feature.label}
                            description={feature.description}
                            control={form.control}
                        />
                    ))}
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
