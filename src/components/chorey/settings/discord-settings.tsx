
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

const discordSchema = z.object({
  enabled: z.boolean(),
  webhookUrl: z.string().url('Voer een geldige URL in.').optional().or(z.literal('')),
}).refine(data => !data.enabled || (data.enabled && data.webhookUrl && data.webhookUrl.trim() !== ''), {
  message: 'Een Webhook URL is vereist als de integratie is ingeschakeld.',
  path: ['webhookUrl'],
});

type DiscordFormValues = z.infer<typeof discordSchema>;

const DiscordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className="h-6 w-6">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.72,56.62.64,80.21a119.42,119.42,0,0,0,29.05,16.15,99.93,99.93,0,0,0,14.38-6.4C44.3,87.21,47.35,85,49,82.5a84,84,0,0,1-14.23-10.11,87.65,87.65,0,0,1-10.12-10.11c-.3-.26-1-1.35-1-1.35a89.5,89.5,0,0,1,10.87,9.33,96.5,96.5,0,0,0,14.61,7.26,95.5,95.5,0,0,0,21.53,0,94.48,94.48,0,0,0,14.61-7.26,89.76,89.76,0,0,0,10.87-9.33s-.75,1.09-1,1.35a87.65,87.65,0,0,1-10.12,10.11,84,84,0,0,1-14.23,10.11c1.65,2.5,4.7,4.71,4.95,5,5.13,3.23,10,5.85,14.38,6.4a119.42,119.42,0,0,0,29.05-16.15c2.36-23.59-2.15-47.56-18.75-72.14Z"/>
        <path d="M42.58,65.63a12.63,12.63,0,0,1-12.7-12.51,12.38,12.38,0,0,1,12.7-12.51,12.53,12.53,0,0,1,12.7,12.51A12.53,12.53,0,0,1,42.58,65.63Zm42,0a12.63,12.63,0,0,1-12.7-12.51,12.38,12.38,0,0,1,12.7-12.51,12.53,12.53,0,0,1,12.7,12.51A12.53,12.53,0,0,1,84.54,65.63Z"/>
    </svg>
);


export default function DiscordSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DiscordFormValues>({
    resolver: zodResolver(discordSchema),
    values: {
      enabled: organization.settings?.discord?.enabled ?? false,
      webhookUrl: organization.settings?.discord?.webhookUrl ?? '',
    },
  });

  const onSubmit = async (data: DiscordFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        discord: data
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Discord instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <DiscordIcon />
            Discord Integratie
        </CardTitle>
        <CardDescription>
            Ontvang real-time notificaties van Chorey in uw Discord-kanaal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                Creëer een 'Webhook' in uw Discord server-instellingen voor het gewenste kanaal en plak de gegenereerde URL hieronder.
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
                            <FormLabel className="text-base">Discord Notificaties</FormLabel>
                            <p className="text-sm text-muted-foreground">Schakel in om notificaties naar Discord te sturen.</p>
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
                            <Input placeholder="https://discord.com/api/webhooks/..." {...field} />
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
