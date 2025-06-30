
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as Fd } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Palette, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/organization.actions';
import type { Organization } from '@/lib/types';

const brandingSchema = z.object({
  primaryColor: z.string().optional(),
  // logoUrl: z.string().url().optional(), // For future use
});
type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    values: {
      primaryColor: organization.settings?.branding?.primaryColor || '',
    },
  });

  const onSubmit = async (data: BrandingFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        branding: {
            ...organization.settings?.branding,
            ...data
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Branding instellingen zijn bijgewerkt.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette /> Branding & Uiterlijk
        </CardTitle>
        <CardDescription>
          Pas de kleuren en het logo van uw organisatie aan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primaire Kleur (HSL)</FormLabel>
                        <FormControl>
                            <Input placeholder="bijv. 221.2 83.2% 53.3%" {...field} />
                        </FormControl>
                        <Fd>
                            Voer een HSL-kleurwaarde in zonder 'hsl()' of graden. <a href="https://hslpicker.com/" target="_blank" rel="noopener noreferrer" className="underline">Vind hier je kleur</a>.
                        </Fd>
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
