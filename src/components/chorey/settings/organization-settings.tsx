
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const orgSettingsSchema = z.object({
  name: z.string().min(2, 'Organisatienaam moet minimaal 2 karakters bevatten.'),
});
type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

export default function OrganizationSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);

  const orgForm = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    values: {
      name: organization.name,
    },
  });

  const onSubmitOrgName = async (data: OrgSettingsFormValues) => {
    if (!user) return;
    setIsSubmittingOrg(true);
    const result = await updateOrganization(organization.id, user.id, { name: data.name });
    setIsSubmittingOrg(false);
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Organisatienaam is bijgewerkt.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisatie-instellingen</CardTitle>
        <CardDescription>Beheer de instellingen voor de organisatie '{organization.name}'.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...orgForm}>
          <form onSubmit={orgForm.handleSubmit(onSubmitOrgName)} className="space-y-4 max-w-md">
            <FormField
              control={orgForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisatienaam</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmittingOrg}>
              {isSubmittingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Naam Wijzigen
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
