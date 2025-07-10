
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Megaphone, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrganization } from '@/app/actions/core/organization.actions';
import type { Organization } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

const announcementSchema = z.object({
  message: z.string().min(1, 'Bericht mag niet leeg zijn.'),
  level: z.enum(['info', 'warning', 'emergency']),
});
type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementSettings({ organization }: { organization: Organization }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAnnouncement = organization.settings?.announcement;

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    values: {
      message: currentAnnouncement?.message || '',
      level: currentAnnouncement?.level || 'info',
    },
  });

  const onSubmit = async (data: AnnouncementFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const newSettings = {
        ...organization.settings,
        announcement: {
            id: crypto.randomUUID(),
            ...data
        }
    };

    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Aankondiging is geplaatst.' });
    }
    setIsSubmitting(false);
  };

  const onClear = async () => {
    if (!user) return;
    setIsSubmitting(true);
     const newSettings = {
        ...organization.settings,
        announcement: null
    };
    const result = await updateOrganization(organization.id, user.id, { settings: newSettings });
     if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Aankondiging is verwijderd.' });
      form.reset({ message: '', level: 'info' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone /> Organisatie Aankondiging
        </CardTitle>
        <CardDescription>
          Plaats een banner die voor alle gebruikers in de organisatie bovenaan het dashboard zichtbaar is. Gebruik 'Noodgeval' voor kritieke, niet-verbergbare meldingen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentAnnouncement && (
            <Alert className="mb-4">
                <Megaphone className="h-4 w-4" />
                <AlertDescription>
                    Huidige aankondiging: "{currentAnnouncement.message}"
                </AlertDescription>
            </Alert>
        )}
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bericht</FormLabel>
                        <FormControl>
                            <Textarea placeholder="bijv. Let op: gepland onderhoud aanstaande zaterdag om 22:00." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Niveau</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="info">Info (Blauw)</SelectItem>
                                    <SelectItem value="warning">Waarschuwing (Geel)</SelectItem>
                                    <SelectItem value="emergency">Noodgeval (Rood, niet-verbergbaar)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    {currentAnnouncement && (
                        <Button type="button" variant="destructive" onClick={onClear} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Verwijder Huidige
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {currentAnnouncement ? 'Aankondiging Bijwerken' : 'Plaats Aankondiging'}
                    </Button>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
