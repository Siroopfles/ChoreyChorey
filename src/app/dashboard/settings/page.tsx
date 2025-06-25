
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, handleGenerateAvatar } from '@/app/actions';

const settingsSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, { name: data.name });
    setIsSubmitting(false);

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Je naam is bijgewerkt.' });
    }
  };

  const onGenerateAvatar = async () => {
    if (!user) return;
    setIsGeneratingAvatar(true);
    const avatarResult = await handleGenerateAvatar(user.name);

    if (avatarResult.error) {
      toast({ title: 'Fout bij avatar generatie', description: avatarResult.error, variant: 'destructive' });
    } else if (avatarResult.avatarDataUri) {
      const updateResult = await updateUserProfile(user.id, { avatar: avatarResult.avatarDataUri });
      if (updateResult.error) {
        toast({ title: 'Fout bij opslaan avatar', description: updateResult.error, variant: 'destructive' });
      } else {
        await refreshUser();
        toast({ title: 'Avatar bijgewerkt!', description: 'Je nieuwe AI-avatar is ingesteld.' });
      }
    }
    setIsGeneratingAvatar(false);
  };

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Instellingen</h1>
      </div>
        <Card>
          <CardHeader>
            <CardTitle>Profiel</CardTitle>
            <CardDescription>
              Beheer hier je profielinstellingen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 text-center mb-8">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                        <User className="h-12 w-12" />
                    </AvatarFallback>
                </Avatar>
                <Button onClick={onGenerateAvatar} disabled={isGeneratingAvatar} variant="outline">
                    {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Nieuwe AI Avatar
                </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input placeholder="Je naam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                    <FormLabel>E-mailadres</FormLabel>
                    <Input value={user.email} disabled />
                </FormItem>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Wijzigingen Opslaan
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
    </div>
  );
}
