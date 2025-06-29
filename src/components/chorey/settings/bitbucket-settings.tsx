
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BitbucketIcon } from '../provider-icons';


const bitbucketSchema = z.object({
  enabled: z.boolean().default(false),
  workspace: z.string().optional(),
  repos: z.string().optional(),
}).refine(data => !data.enabled || (data.enabled && data.workspace && data.repos), {
  message: 'Workspace en Repositories zijn vereist als de integratie is ingeschakeld.',
  path: ['workspace'],
});
type BitbucketFormValues = z.infer<typeof bitbucketSchema>;

const BitbucketSettingsIcon = () => (
    <div className="h-6 w-6 text-blue-600">
        <BitbucketIcon />
    </div>
);


export default function BitbucketSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BitbucketFormValues>({
    resolver: zodResolver(bitbucketSchema),
    values: {
      enabled: organization.settings?.features?.bitbucket ?? false,
      workspace: organization.settings?.bitbucket?.workspace || '',
      repos: (organization.settings?.bitbucket?.repos || []).join(', '),
    },
  });

  const isEnabled = form.watch('enabled');

  const onSubmit = async (data: BitbucketFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        features: {
          ...organization.settings?.features,
          bitbucket: data.enabled,
        },
        bitbucket: {
            workspace: data.workspace || '',
            repos: data.repos ? data.repos.split(',').map(r => r.trim()).filter(Boolean) : [],
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Bitbucket instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BitbucketSettingsIcon /> Bitbucket Integratie
        </CardTitle>
        <CardDescription>
          Koppel taken aan Bitbucket issues door uw repositories te configureren.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                U moet een Bitbucket App Password aanmaken met 'repository:read' en 'issue:read' permissies. Voeg uw Bitbucket gebruikersnaam en het App Password toe aan uw <code>.env</code> bestand als <code>BITBUCKET_USERNAME</code> en <code>BITBUCKET_APP_PASSWORD</code>.
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
                                <FormLabel className="text-base">Bitbucket Integratie Inschakelen</FormLabel>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                {isEnabled && (
                  <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="workspace"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Workspace</FormLabel>
                            <FormControl>
                                <Input placeholder="bijv. 'mijn-team'" {...field} />
                            </FormControl>
                            <FormDescription>De ID of slug van uw Bitbucket workspace.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="repos"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Repositories</FormLabel>
                            <FormControl>
                                <Input placeholder="bijv. 'frontend-app, backend-api'" {...field} />
                            </FormControl>
                            <FormDescription>Een komma-gescheiden lijst van repository slugs.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                  </div>
                )}
                
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
