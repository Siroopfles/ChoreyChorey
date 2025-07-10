
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
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions/user/member.actions';
import type { User } from '@/lib/types';

const clockifySchema = z.object({
  clockifyApiToken: z.string().min(1, 'API Token is vereist.'),
});
type ClockifyFormValues = z.infer<typeof clockifySchema>;

const ClockifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"></path>
    </svg>
);


export default function ClockifySettings({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClockifyFormValues>({
    resolver: zodResolver(clockifySchema),
    values: {
      clockifyApiToken: user.clockifyApiToken || '',
    },
  });

  const onSubmit = async (data: ClockifyFormValues) => {
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, { clockifyApiToken: data.clockifyApiToken });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Clockify API Token is opgeslagen.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockifyIcon /> Clockify Integratie
        </CardTitle>
        <CardDescription>
          Verbind uw Clockify account om tijdregistraties te synchroniseren. U vindt uw API-token in uw Clockify profielinstellingen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="clockifyApiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clockify API Token</FormLabel>
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
