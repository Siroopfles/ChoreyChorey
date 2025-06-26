
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
import { Loader2, User, Bot, Tags, Check, X, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions/user.actions';
import { handleGenerateAvatar } from '@/app/actions/ai.actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ALL_SKILLS } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/lib/types';

const profileSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
  skills: z.array(z.string()).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings({ user }: { user: UserType }) {
  const { refreshUser, users } = useAuth();
  const { toast } = useToast();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const fullUserData = users.find(u => u.id === user.id) || user;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user.name,
      skills: user.skills || [],
    },
  });

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    const result = await updateUserProfile(user.id, { name: data.name, skills: data.skills });
    setIsSubmittingProfile(false);

    if (result.error) {
      toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Je profiel is bijgewerkt.' });
    }
  };

  const onGenerateAvatar = async () => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiel</CardTitle>
        <CardDescription>Beheer hier je profielinstellingen.</CardDescription>
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
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4 max-w-md mx-auto">
            <FormField
              control={profileForm.control}
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
            <FormField
              control={profileForm.control}
              name="skills"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Vaardigheden</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                          <Tags className="mr-2 h-4 w-4" />
                          {field.value?.length > 0 ? `${field.value.length} geselecteerd` : 'Selecteer vaardigheden'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Zoek vaardigheid..." />
                        <CommandList>
                          <CommandEmpty>Geen vaardigheid gevonden.</CommandEmpty>
                          <CommandGroup>
                            {ALL_SKILLS.map((skill) => {
                              const isSelected = field.value?.includes(skill);
                              return (
                                <CommandItem
                                  key={skill}
                                  onSelect={() => {
                                    if (isSelected) {
                                      profileForm.setValue('skills', field.value?.filter((s) => s !== skill));
                                    } else {
                                      profileForm.setValue('skills', [...(field.value || []), skill]);
                                    }
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                                  {skill}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="pt-1 h-fit min-h-[22px]">
                    {field.value?.map((skill: string) => {
                      const endorsementCount = fullUserData.endorsements?.[skill]?.length || 0;
                      return (
                        <Badge variant="secondary" key={skill} className="mr-1 mb-1">
                          {skill}
                          {endorsementCount > 0 && (
                            <span className="flex items-center ml-1.5 pl-1.5 border-l border-muted-foreground/30">
                              <Star className="h-3 w-3 mr-1 text-amber-500"/>
                              {endorsementCount}
                            </span>
                          )}
                          <button
                            type="button"
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => profileForm.setValue('skills', field.value?.filter((s: string) => s !== skill))}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Profiel Opslaan
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
