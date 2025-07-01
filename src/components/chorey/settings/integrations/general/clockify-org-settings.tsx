
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
import { ClockifyIcon } from '@/components/chorey/common/provider-icons';

const clockifySchema = z.object({
  enabled: z.boolean().default(false),
});
type ClockifyFormValues = z.infer<typeof clockifySchema>;

export default function ClockifyOrgSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClockifyFormValues>({
    resolver: zodResolver(clockifySchema),
    values: {
      enabled: organization.settings?.features?.clockify ?? false,
    },
  });

  const onSubmit = async (data: ClockifyFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        features: {
          ...organization.settings?.features,
          clockify: data.enabled,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Clockify instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockifyIcon className="h-6 w-6" /> Clockify Integratie
        </CardTitle>
        <CardDescription>
          Sta gebruikers in de organisatie toe om hun persoonlijke Clockify-account te koppelen voor tijdregistratie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Clockify Integratie Inschakelen</FormLabel>
                                <p className="text-sm text-muted-foreground">Gebruikers kunnen hierna hun eigen API-token invoeren.</p>
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
