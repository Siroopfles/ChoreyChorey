
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JiraIcon } from '@/components/chorey/common/provider-icons';

const jiraSchema = z.object({
  enabled: z.boolean().default(false),
});
type JiraFormValues = z.infer<typeof jiraSchema>;

export default function JiraSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JiraFormValues>({
    resolver: zodResolver(jiraSchema),
    values: {
      enabled: organization.settings?.features?.jira ?? false,
    },
  });

  const onSubmit = async (data: JiraFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        features: {
          ...organization.settings?.features,
          jira: data.enabled,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Jira instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <JiraIcon className="h-6 w-6 text-[#0052CC]" /> Jira Integratie
        </CardTitle>
        <CardDescription>
          Koppel taken aan Jira issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
              U moet uw Jira basis URL (bv. <code>https://uwteam.atlassian.net</code>), gebruikers e-mail, en een API-token toevoegen aan uw <code>.env</code> bestand als <code>JIRA_BASE_URL</code>, <code>JIRA_USER_EMAIL</code>, en <code>JIRA_API_TOKEN</code>.
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
                                <FormLabel className="text-base">Jira Integratie Inschakelen</FormLabel>
                                <p className="text-sm text-muted-foreground">Sta het koppelen van Jira issues toe.</p>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Opslaan
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
