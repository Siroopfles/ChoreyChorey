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
import { Loader2, Save, Gitlab } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const gitlabSchema = z.object({
  projects: z.string().min(1, 'Minstens één project is vereist.'),
});
type GitlabFormValues = z.infer<typeof gitlabSchema>;

export default function GitLabSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GitlabFormValues>({
    resolver: zodResolver(gitlabSchema),
    values: {
      projects: (organization.settings?.gitlab?.projects || []).join(', '),
    },
  });

  const onSubmit = async (data: GitlabFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        gitlab: {
            ...organization.settings?.gitlab,
            projects: data.projects.split(',').map(p => p.trim()).filter(Boolean),
        }
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
