'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Volume2, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions/user/user.actions';
import type { User } from '@/lib/types';
import { NOTIFICATION_EVENT_TYPES_FOR_SOUNDS, NOTIFICATION_SOUNDS } from '@/lib/types';

// NOTE: This component assumes audio files are present in the `public/sounds/` directory.
// For example: `public/sounds/chime.mp3`, `public/sounds/bubble.mp3`, etc.
// Since I cannot create binary files, you must add these files yourself.

const soundSettingsSchema = z.object({
  notificationSounds: z.record(z.string()),
});

type SoundSettingsFormValues = z.infer<typeof soundSettingsSchema>;

export default function NotificationSoundSettings({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SoundSettingsFormValues>({
    resolver: zodResolver(soundSettingsSchema),
    values: {
      notificationSounds: user.notificationSounds || {},
    },
  });

  const onSubmit = async (data: SoundSettingsFormValues) => {
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, { notificationSounds: data.notificationSounds });
    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Notificatiegeluiden zijn opgeslagen.' });
    }
    setIsSubmitting(false);
  };

  const playSound = (soundFile: string) => {
    if (soundFile && soundFile !== 'none') {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.play().catch(e => console.error("Error playing sound:", e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music /> Notificatiegeluiden
        </CardTitle>
        <CardDescription>
          Personaliseer de geluiden die je hoort voor verschillende soorten notificaties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {Object.entries(NOTIFICATION_EVENT_TYPES_FOR_SOUNDS).map(([event, label]) => (
                <FormField
                  key={event}
                  control={form.control}
                  name={`notificationSounds.${event}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} value={field.value || 'chime.mp3'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kies een geluid..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NOTIFICATION_SOUNDS.map(sound => (
                              <SelectItem key={sound.id} value={sound.id}>{sound.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => playSound(field.value)}
                          disabled={!field.value || field.value === 'none'}
                          aria-label={`Speel ${field.value} af`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Geluiden Opslaan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
