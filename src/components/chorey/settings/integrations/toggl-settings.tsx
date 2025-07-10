
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions/user/member.actions';
import type { User } from '@/lib/types';

const togglSchema = z.object({
  togglApiToken: z.string().min(1, 'API Token is vereist.'),
});
type TogglFormValues = z.infer<typeof togglSchema>;

export default function TogglSettings({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TogglFormValues>({
    resolver: zodResolver(togglSchema),
    values: {
      togglApiToken: user.togglApiToken || '',
    },
  });

  const onSubmit = async (data: TogglFormValues) => {
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, { togglApiToken: data.togglApiToken });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Toggl API Token is opgeslagen.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock /> Toggl Track Integratie
        </CardTitle>
        <CardDescription>
          Verbind uw Toggl account om tijdregistraties te synchroniseren. U vindt uw API-token in uw Toggl profielinstellingen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="togglApiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Toggl API Token</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              API Token Opslaan
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
