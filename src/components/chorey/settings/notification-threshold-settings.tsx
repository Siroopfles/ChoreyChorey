
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const thresholdSchema = z.object({
  projectBudgetEnabled: z.boolean().default(false),
  projectBudgetPercentage: z.number().min(0).max(100).default(80),
});
type ThresholdFormValues = z.infer<typeof thresholdSchema>;

export default function NotificationThresholdSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdSchema),
    values: {
      projectBudgetEnabled: organization.settings?.notificationThresholds?.projectBudget?.enabled ?? false,
      projectBudgetPercentage: organization.settings?.notificationThresholds?.projectBudget?.percentage ?? 80,
    },
  });

  const onSubmit = async (data: ThresholdFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        notificationThresholds: {
            projectBudget: {
                enabled: data.projectBudgetEnabled,
                percentage: data.projectBudgetPercentage,
            },
        },
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Notificatiedrempels zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing /> Automatische Waarschuwingen
        </CardTitle>
        <CardDescription>
          Stel drempels in om automatisch notificaties te ontvangen voor belangrijke projectgebeurtenissen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4">
              <FormField
                  control={form.control}
                  name="projectBudgetEnabled"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                              <FormLabel className="text-base">Projectbudget Waarschuwing</FormLabel>
                              <FormDescription>Ontvang een notificatie wanneer het projectbudget een bepaald percentage bereikt.</FormDescription>
                          </div>
                          <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                      </FormItem>
                  )}
              />
              {form.watch('projectBudgetEnabled') && (
                 <FormField
                    control={form.control}
                    name="projectBudgetPercentage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Drempelpercentage ({field.value}%)</FormLabel>
                            <FormControl>
                                <Slider
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                  />
              )}
            </div>
            
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Drempels Opslaan
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
