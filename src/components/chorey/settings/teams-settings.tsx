
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const teamsSchema = z.object({
  enabled: z.boolean(),
  webhookUrl: z.string().url('Voer een geldige URL in.').optional().or(z.literal('')),
}).refine(data => !data.enabled || (data.enabled && data.webhookUrl && data.webhookUrl.trim() !== ''), {
  message: 'Een Webhook URL is vereist als de integratie is ingeschakeld.',
  path: ['webhookUrl'],
});

type TeamsFormValues = z.infer<typeof teamsSchema>;

const TeamsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M21.5,8.13a.5.5,0,0,0-.4-.5H18.25V5.5a.5.5,0,0,0-.5-.5H15.62a.5.5,0,0,0-.5.5v2.13H12.25a.5.5,0,0,0-.5.5v2.87a.5.5,0,0,0,.5.5h2.87V14.5a.5.5,0,0,0,.5.5h2.13a.5.5,0,0,0,.5-.5V11.5h2.85a.5.5,0,0,0,.4-.5ZM12.33,14.65a2,2,0,1,0-2.3-2.3A2,2,0,0,0,12.33,14.65Zm7.11-1.47a2.5,2.5,0,0,0-2.5-2.5h-1v-1a2.5,2.5,0,0,0-2.5-2.5h-1a2.5,2.5,0,0,0-2.5,2.5v1h-1a2.5,2.5,0,0,0-2.5,2.5v1a2.5,2.5,0,0,0,2.5,2.5h1v1a2.5,2.5,0,0,0,2.5,2.5h1a2.5,2.5,0,0,0,2.5-2.5v-1h1a2.5,2.5,0,0,0,2.5-2.5Zm-8,.48a.67.67,0,1,1,.67-.67A.67.67,0,0,1,11.41,13.66Z"/>
    </svg>
);


export default function TeamsSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamsFormValues>({
    resolver: zodResolver(teamsSchema),
    values: {
      enabled: organization.settings?.teams?.enabled ?? false,
      webhookUrl: organization.settings?.teams?.webhookUrl ?? '',
    },
  });

  const onSubmit = async (data: TeamsFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        teams: data
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Microsoft Teams instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TeamsIcon />
            Microsoft Teams Integratie
        </CardTitle>
        <CardDescription>
            Ontvang real-time notificaties van Chorey in uw Microsoft Teams-kanaal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                Voeg een 'Incoming Webhook' connector toe aan het gewenste Teams-kanaal en plak de gegenereerde URL hieronder.
            </AlertDescription>
        </Alert>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Teams Notificaties</FormLabel>
                            <p className="text-sm text-muted-foreground">Schakel in om notificaties naar Teams te sturen.</p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://your-tenant.webhook.office.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
