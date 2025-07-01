
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const slackSchema = z.object({
  enabled: z.boolean(),
  channelId: z.string().optional(),
}).refine(data => !data.enabled || (data.enabled && data.channelId && data.channelId.trim() !== ''), {
  message: 'Een Channel ID is vereist als de integratie is ingeschakeld.',
  path: ['channelId'],
});

type SlackFormValues = z.infer<typeof slackSchema>;

export default function SlackSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SlackFormValues>({
    resolver: zodResolver(slackSchema),
    values: {
      enabled: organization.settings?.slack?.enabled ?? false,
      channelId: organization.settings?.slack?.channelId ?? '',
    },
  });

  const onSubmit = async (data: SlackFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        slack: data
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Slack-instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M5.04 15.12c0 1.58-1.28 2.86-2.86 2.86S-.7 16.7 0 15.12c0-1.58 1.28-2.86 2.86-2.86h2.86v2.86H5.04zm.02-4.48h-2.2v-2.2c0-1.58 1.28-2.86 2.86-2.86s2.86 1.28 2.86 2.86c0 1.58-1.28 2.86-2.86 2.86zm4.48.02v-2.2h-2.2c-1.58 0-2.86-1.28-2.86-2.86S5.76 2.72 7.34 2.72s2.86 1.28 2.86 2.86v2.2h2.2c1.58 0 2.86 1.28 2.86 2.86s-1.28 2.86-2.86 2.86zm-4.48.02h2.2v2.2c0 1.58-1.28 2.86-2.86 2.86S2.72 16.7 2.72 15.12s1.28-2.86 2.86-2.86zm8.88-4.48v2.2h2.2c1.58 0 2.86 1.28 2.86 2.86s-1.28 2.86-2.86 2.86s-2.86-1.28-2.86-2.86V8.4h-2.2c-1.58 0-2.86-1.28-2.86-2.86S12.24 2.7 13.82 2.7s2.86 1.28 2.86 2.86zm4.48-.02h2.2v2.2c0 1.58 1.28 2.86 2.86 2.86s2.86-1.28 2.86-2.86s-1.28-2.86-2.86-2.86zm-4.48-.02v2.2h2.2c1.58 0 2.86 1.28 2.86 2.86s-1.28 2.86-2.86 2.86s-2.86-1.28-2.86-2.86V5.78s0 0 0 0zm4.48.02h-2.2v-2.2c0-1.58 1.28-2.86 2.86-2.86S21.28 4.2 21.28 5.76c0 1.58-1.28 2.86-2.86 2.86z"/></svg>
            Slack Integratie
        </CardTitle>
        <CardDescription>
            Ontvang real-time notificaties van Chorey in uw Slack-kanaal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                U moet een Slack App aanmaken en de 'Bot Token' toevoegen aan uw <code>.env</code> bestand als <code>SLACK_BOT_TOKEN</code>. Geef de bot de <code>chat:write</code> permissie.
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
                            <FormLabel className="text-base">Slack Notificaties</FormLabel>
                            <p className="text-sm text-muted-foreground">Schakel in om notificaties naar Slack te sturen.</p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="channelId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kanaal ID</FormLabel>
                        <FormControl>
                            <Input placeholder="C0123ABCDEF" {...field} />
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
