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
import { Loader2, Save, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const githubSchema = z.object({
  owner: z.string().min(1, 'Eigenaar is vereist.'),
  repos: z.string().min(1, 'Minstens één repository is vereist.'),
});
type GithubFormValues = z.infer<typeof githubSchema>;

export default function GitHubSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GithubFormValues>({
    resolver: zodResolver(githubSchema),
    values: {
      owner: organization.settings?.github?.owner || '',
      repos: (organization.settings?.github?.repos || []).join(', '),
    },
  });

  const onSubmit = async (data: GithubFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        github: {
            owner: data.owner,
            repos: data.repos.split(',').map(r => r.trim()).filter(Boolean),
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'GitHub instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github /> GitHub Integratie
        </CardTitle>
        <CardDescription>
          Koppel taken aan GitHub issues en pull requests door uw repositories te configureren.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Alert className="mb-4">
            <AlertTitle>Configuratie Vereist</AlertTitle>
            <AlertDescription>
                U moet een GitHub Personal Access Token (classic) aanmaken met 'repo' scope en deze toevoegen aan uw <code>.env</code> bestand als <code>GITHUB_TOKEN</code>.
            </AlertDescription>
        </Alert>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Eigenaar</FormLabel>
                        <FormControl>
                            <Input placeholder="bijv. 'microsoft'" {...field} />
                        </FormControl>
                         <FormDescription>De eigenaar van de repositories (gebruiker of organisatie).</FormDescription>
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
                            <Input placeholder="bijv. 'vscode, typescript'" {...field} />
                        </FormControl>
                        <FormDescription>Een komma-gescheiden lijst van repository namen.</FormDescription>
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
