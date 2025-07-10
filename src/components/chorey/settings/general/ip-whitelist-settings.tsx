
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';

const ipWhitelistSchema = z.object({
  ipWhitelist: z.string().optional(),
});
type IpWhitelistFormValues = z.infer<typeof ipWhitelistSchema>;

export default function IpWhitelistSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IpWhitelistFormValues>({
    resolver: zodResolver(ipWhitelistSchema),
    values: {
      ipWhitelist: (organization.settings?.ipWhitelist || []).join(', '),
    },
  });

  const onSubmit = async (data: IpWhitelistFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        ipWhitelist: data.ipWhitelist?.split(',').map(ip => ip.trim()).filter(Boolean) || [],
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'IP Whitelist is bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi /> IP Whitelist
        </CardTitle>
        <CardDescription>
          Beperk de toegang tot de organisatie tot een lijst van specifieke IP-adressen voor extra beveiliging.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="ipWhitelist"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Toegestane IP Adressen</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="8.8.8.8, 2001:4860:4860::8888, 192.168.1.1"
                                {...field}
                                rows={5}
                            />
                        </FormControl>
                        <FormDescription>Voer IP-adressen (IPv4 of IPv6) in, gescheiden door komma's. Laat leeg om de whitelist uit te schakelen.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Whitelist Opslaan
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
