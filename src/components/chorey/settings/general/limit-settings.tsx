
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
import { Loader2, Save, BarChartBig } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const limitsSchema = z.object({
  maxMembers: z.coerce.number().optional(),
  maxTasks: z.coerce.number().optional(),
  maxProjects: z.coerce.number().optional(),
});
type LimitsFormValues = z.infer<typeof limitsSchema>;

export default function LimitSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LimitsFormValues>({
    resolver: zodResolver(limitsSchema),
    values: {
      maxMembers: organization.settings?.limits?.maxMembers,
      maxTasks: organization.settings?.limits?.maxTasks,
      maxProjects: organization.settings?.limits?.maxProjects,
    },
  });

  const onSubmit = async (data: LimitsFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        limits: {
            ...organization.settings?.limits,
            ...data
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Limieten zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartBig /> Organisatielimieten
        </CardTitle>
        <CardDescription>
          Stel limieten in voor het aantal leden, taken en projecten. Leeg laten betekent geen limiet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="maxMembers"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Max. Leden</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Geen limiet" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maxTasks"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Max. Taken</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Geen limiet" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maxProjects"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Max. Projecten</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Geen limiet" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Limieten Opslaan
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
