
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Bot, Tags, Check, X, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, handleGenerateAvatar, updateOrganization, leaveOrganization, deleteOrganization } from '@/app/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ALL_SKILLS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
  skills: z.array(z.string()).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const orgSettingsSchema = z.object({
  name: z.string().min(2, 'Organisatienaam moet minimaal 2 karakters bevatten.'),
});
type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

export default function SettingsPage() {
  const { user, currentOrganization, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user && currentOrganization && user.id === currentOrganization.ownerId;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      skills: user?.skills || [],
    },
  });
  
  const orgForm = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    values: {
        name: currentOrganization?.name || ''
    }
  });

  const onSubmitProfile = async (data: ProfileFormValues) => {
    if (!user) return;
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
  
  const onSubmitOrgName = async (data: OrgSettingsFormValues) => {
    if (!user || !currentOrganization) return;
    setIsSubmittingOrg(true);
    const result = await updateOrganization(currentOrganization.id, user.id, { name: data.name });
    setIsSubmittingOrg(false);
    if(result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
        await refreshUser();
        toast({ title: 'Gelukt!', description: 'Organisatienaam is bijgewerkt.' });
    }
  };
  
  const onLeaveOrg = async () => {
    if (!user || !currentOrganization) return;
    setIsLeaving(true);
    const result = await leaveOrganization(currentOrganization.id, user.id);
    if(result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        setIsLeaving(false);
    } else {
        await refreshUser();
        toast({ title: 'Gelukt!', description: `Je hebt de organisatie ${currentOrganization.name} verlaten.` });
        router.push('/dashboard');
    }
  };
  
  const onDeleteOrg = async () => {
    if (!user || !currentOrganization) return;
    setIsDeleting(true);
    const result = await deleteOrganization(currentOrganization.id, user.id);
     if(result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
        setIsDeleting(false);
    } else {
        await refreshUser();
        toast({ title: 'Organisatie verwijderd!', description: `De organisatie is succesvol verwijderd.` });
        router.push('/dashboard');
    }
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
                        {field.value?.map((skill: string) => (
                          <Badge variant="secondary" key={skill} className="mr-1 mb-1">
                            {skill}
                            <button
                              type="button"
                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => profileForm.setValue('skills', field.value?.filter((s: string) => s !== skill))}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
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

        {currentOrganization && (
            <>
                {isOwner && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Organisatie-instellingen</CardTitle>
                            <CardDescription>Beheer de instellingen voor de organisatie '{currentOrganization.name}'.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...orgForm}>
                                <form onSubmit={orgForm.handleSubmit(onSubmitOrgName)} className="space-y-4 max-w-md">
                                    <FormField
                                        control={orgForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organisatienaam</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSubmittingOrg}>
                                        {isSubmittingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Naam Wijzigen
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Gevarenzone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive/20 p-4">
                            <div>
                                <h3 className="font-semibold">Verlaat Organisatie</h3>
                                <p className="text-sm text-muted-foreground">Je verliest toegang tot alle taken en teams.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="mt-2 sm:mt-0 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive" disabled={isOwner}>
                                        Organisatie Verlaten
                                    </Button>
                                </AlertDialogTrigger>
                                {isOwner && <p className="text-xs text-muted-foreground mt-1 sm:hidden">Eigenaar kan niet verlaten.</p>}
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Deze actie kan niet ongedaan worden gemaakt. Je wordt uit de organisatie '{currentOrganization.name}' verwijderd.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                        <AlertDialogAction onClick={onLeaveOrg} disabled={isLeaving} className="bg-destructive hover:bg-destructive/90">
                                            {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Verlaten
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                         {isOwner && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive/20 p-4">
                                <div>
                                    <h3 className="font-semibold">Verwijder Organisatie</h3>
                                    <p className="text-sm text-muted-foreground">Alle data, inclusief taken, teams en leden, wordt permanent verwijderd.</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="mt-2 sm:mt-0">
                                            Organisatie Verwijderen
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Weet je absoluut zeker?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Deze actie kan niet ongedaan worden gemaakt. Dit zal de organisatie '{currentOrganization.name}' en alle bijbehorende data permanent verwijderen.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                            <AlertDialogAction onClick={onDeleteOrg} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Verwijderen
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </>
        )}
    </div>
  );
}
