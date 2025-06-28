
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
import { Loader2, Save, Gamepad2, Database, Timer, HeartHandshake, Trophy, Lightbulb, UserCheck, Globe, Clock, Gitlab } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const ClockifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"></path>
    </svg>
);

const JiraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#0052CC]">
      <path d="M22.516 13.313l-9.219-9.219c-.438-.438-1.125-.438-1.563 0l-9.219 9.219c-.438.438-.438 1.125 0 1.563l9.219 9.219c.438.438 1.125.438 1.563 0l9.219-9.219c.438-.438.438-1.125 0-1.563zm-10.781 7.438l-7.438-7.438 7.438-7.438 7.438 7.438-7.438 7.438z"></path>
    </svg>
);

const BitbucketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-600">
        <path d="M2.531 2.375l8.594 19.25-2.093 0.938-6.5-14.563v13.625h-2.125v-19.25h2.125zM22.563 15.188l-4.125-2.531-2.031 3.406 6.156-3.75zM12.969 4.313l-1.031 2.313-4.5-2.75 5.531-3.625z"></path>
    </svg>
);


const featureSchema = z.object({
  gamification: z.boolean().default(true),
  storyPoints: z.boolean().default(true),
  timeTracking: z.boolean().default(true),
  mentorship: z.boolean().default(true),
  goals: z.boolean().default(true),
  ideas: z.boolean().default(true),
  raci: z.boolean().default(true),
  publicSharing: z.boolean().default(true),
  toggl: z.boolean().default(false),
  clockify: z.boolean().default(false),
  jira: z.boolean().default(false),
  gitlab: z.boolean().default(false),
  bitbucket: z.boolean().default(false),
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
      toggl: organization.settings?.features?.toggl ?? false,
      clockify: organization.settings?.features?.clockify ?? false,
      jira: organization.settings?.features?.jira ?? false,
      gitlab: organization.settings?.features?.gitlab ?? false,
      bitbucket: organization.settings?.features?.bitbucket ?? false,
    },
  });

  const onSubmit = async (data: FeatureFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        features: {
            ...organization.settings?.features,
            ...data
        }
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
      { name: 'toggl', icon: Clock, label: 'Toggl Integratie', description: 'Sta gebruikers toe om hun Toggl-account te koppelen voor tijdregistratie.' },
      { name: 'clockify', icon: ClockifyIcon, label: 'Clockify Integratie', description: 'Sta gebruikers toe om hun Clockify-account te koppelen voor tijdregistratie.' },
      { name: 'jira', icon: JiraIcon, label: 'Jira Integratie', description: 'Sta toe dat taken gekoppeld worden aan Jira issues.' },
      { name: 'gitlab', icon: Gitlab, label: 'GitLab Integratie', description: 'Sta toe dat taken gekoppeld worden aan GitLab issues en MRs.' },
      { name: 'bitbucket', icon: BitbucketIcon, label: 'Bitbucket Integratie', description: 'Sta toe dat taken gekoppeld worden aan Bitbucket issues.' },
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
