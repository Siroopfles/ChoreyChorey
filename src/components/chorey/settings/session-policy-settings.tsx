
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
import { Loader2, Save, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const sessionPolicySchema = z.object({
  idleTimeoutSeconds: z.coerce.number().positive().optional().or(z.literal('')),
  absoluteTimeoutSeconds: z.coerce.number().positive().optional().or(z.literal('')),
});
type SessionPolicyFormValues = z.infer<typeof sessionPolicySchema>;

export default function SessionPolicySettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SessionPolicyFormValues>({
    resolver: zodResolver(sessionPolicySchema),
    values: {
      idleTimeoutSeconds: organization.settings?.sessionPolicy?.idleTimeoutSeconds || '',
      absoluteTimeoutSeconds: organization.settings?.sessionPolicy?.absoluteTimeoutSeconds || '',
    },
  });

  const onSubmit = async (data: SessionPolicyFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        sessionPolicy: {
            idleTimeoutSeconds: data.idleTimeoutSeconds ? Number(data.idleTimeoutSeconds) : undefined,
            absoluteTimeoutSeconds: data.absoluteTimeoutSeconds ? Number(data.absoluteTimeoutSeconds) : undefined,
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Sessiebeleid is bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer /> Sessiebeleid
        </CardTitle>
        <CardDescription>
          Stel time-outs in voor inactiviteit en maximale sessieduur. Leeg laten betekent geen limiet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="idleTimeoutSeconds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Time-out bij inactiviteit</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="bv. 1800" {...field} />
                            </FormControl>
                            <FormDescription>Aantal seconden van inactiviteit voordat een gebruiker wordt uitgelogd.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="absoluteTimeoutSeconds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Absolute time-out</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="bv. 86400" {...field} />
                            </FormControl>
                            <FormDescription>Maximale duur van een sessie in seconden, ongeacht activiteit.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Beleid Opslaan
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
