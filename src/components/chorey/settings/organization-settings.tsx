
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
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization, Permission } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
import { Label } from '@/components/ui/label';

const orgSettingsSchema = z.object({
  name: z.string().min(2, 'Organisatienaam moet minimaal 2 karakters bevatten.'),
});
type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

export default function OrganizationSettings({ organization, currentUserPermissions }: { organization: Organization, currentUserPermissions: Permission[] }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);

  const canManageGeneralSettings = currentUserPermissions.includes(PERMISSIONS.MANAGE_GENERAL_SETTINGS);

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
        <CardTitle>Algemeen</CardTitle>
        <CardDescription>Beheer de algemene instellingen voor de organisatie '{organization.name}'.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...orgForm}>
          <form onSubmit={orgForm.handleSubmit(onSubmitOrgName)} className="space-y-4 max-w-md">
            <FormField
              control={orgForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisatienaam</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canManageGeneralSettings} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmittingOrg || !canManageGeneralSettings || !orgForm.formState.isDirty}>
              {isSubmittingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Naam Wijzigen
            </Button>
          </form>
        </Form>
        <div className="space-y-2 pt-4 border-t max-w-md">
            <Label htmlFor="data-residency">Data Locatie</Label>
            <Input id="data-residency" value={organization.dataResidency === 'EU' ? 'Europese Unie' : 'Verenigde Staten (Standaard)'} disabled />
            <FormDescription>
                De geografische locatie waar uw data wordt opgeslagen. Dit kan niet worden gewijzigd na het aanmaken.
            </FormDescription>
        </div>
      </CardContent>
    </Card>
  );
}
