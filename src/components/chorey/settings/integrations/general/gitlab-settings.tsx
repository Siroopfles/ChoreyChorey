
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Gitlab } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const gitlabSchema = z.object({
  enabled: z.boolean().default(false),
  projects: z.string().optional(),
}).refine(data => !data.enabled || (data.enabled && data.projects), {
  message: 'Minstens één project is vereist als de integratie is ingeschakeld.',
  path: ['projects'],
});

type GitlabFormValues = z.infer<typeof gitlabSchema>;

export default function GitLabSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GitlabFormValues>({
    resolver: zodResolver(gitlabSchema),
    values: {
      enabled: !!organization.settings?.gitlab,
      projects: (organization.settings?.gitlab?.projects || []).join(', '),
    },
  });

  const isEnabled = form.watch('enabled');

  const onSubmit = async (data: GitlabFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        gitlab: data.enabled ? {
            projects: data.projects ? data.projects.split(',').map(p => p.trim()).filter(Boolean) : [],
        } : undefined,
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'GitLab instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gitlab /> GitLab Integratie
        </CardTitle>
        <CardDescription>
          Koppel taken aan GitLab issues en merge requests door uw projecten te configureren.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                U moet een GitLab Personal Access Token aanmaken met 'api' scope en deze toevoegen aan uw <code>.env</code> bestand als <code>GITLAB_TOKEN</code>.
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
                                <FormLabel className="text-base">GitLab Integratie Inschakelen</FormLabel>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                {isEnabled && (
                  <FormField
                      control={form.control}
                      name="projects"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Projecten</FormLabel>
                          <FormControl>
                              <Input placeholder="bijv. 'mijngroep/mijnproject', 'andereteam/superproject'" {...field} />
                          </FormControl>
                          <FormDescription>Een komma-gescheiden lijst van volledige projectpaden (groep/project).</FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
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
