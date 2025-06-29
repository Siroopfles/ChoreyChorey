
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Bot, Tags, Check, X, Star, Bell, Globe, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, generateAvatarAction } from '@/app/actions/user.actions';
import { updateMemberProfile } from '@/app/actions/member.actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ALL_SKILLS, type Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten.'),
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
  timezone: z.string().optional(),
  website: z.string().url('Voer een geldige URL in.').or(z.literal('')).optional(),
  location: z.string().optional(),
  workingHours: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings({ user }: { user: UserType }) {
  const { refreshUser } = useAuth();
  const { users, currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const fullUserData = (users || []).find(u => u.id === user.id) || user;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user.name,
      skills: user.skills || [],
      bio: user.bio || '',
      timezone: user.timezone || '',
      website: user.website || '',
      location: user.location || '',
      workingHours: user.workingHours || { startTime: '09:00', endTime: '17:00' },
    },
  });

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    
    // Split data into global and org-specific updates
    const globalUpdates = {
      name: data.name,
      bio: data.bio,
      timezone: data.timezone,
      website: data.website,
      location: data.location,
    };

    const orgSpecificUpdates = {
      skills: data.skills,
      workingHours: data.workingHours,
    };
    
    const globalResult = await updateUserProfile(user.id, globalUpdates);
    let orgResult = { success: true, error: null as string | null };

    if (currentOrganization) {
      orgResult = await updateMemberProfile(currentOrganization.id, user.id, orgSpecificUpdates);
    }
    
    setIsSubmittingProfile(false);

    if (globalResult.error || orgResult.error) {
      toast({ title: 'Fout', description: globalResult.error || orgResult.error, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: 'Gelukt!', description: 'Je profiel is bijgewerkt.' });
    }
  };

  const onGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
        const { avatarUrl } = await generateAvatarAction(user.id, user.name);
        const updateResult = await updateUserProfile(user.id, { avatar: avatarUrl });
        if (updateResult.error) {
            toast({ title: 'Fout bij opslaan avatar', description: updateResult.error, variant: 'destructive' });
        } else {
            await refreshUser();
            toast({ title: 'Avatar bijgewerkt!', description: 'Je nieuwe AI-avatar is ingesteld.' });
        }
    } catch (e: any) {
         toast({ title: 'Fout bij avatar generatie', description: e.message, variant: 'destructive' });
    }
    setIsGeneratingAvatar(false);
  };
  
  const handleDigestToggle = async (enabled: boolean) => {
    if (!currentOrganization) return;
    const result = await updateMemberProfile(currentOrganization.id, user.id, {
        notificationSettings: {
            ...user.notificationSettings,
            dailyDigestEnabled: enabled,
        }
    });
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Instelling opgeslagen!'});
        await refreshUser();
    }
  };
  
  const handlePriorityThresholdChange = async (threshold: Priority) => {
    if (!currentOrganization) return;
    const result = await updateMemberProfile(currentOrganization.id, user.id, {
        notificationSettings: {
            ...user.notificationSettings,
            notificationPriorityThreshold: threshold,
        }
    });
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Instelling opgeslagen!'});
        await refreshUser();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profiel</CardTitle>
          <CardDescription>Beheer hier je profielinstellingen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4 max-w-lg mx-auto">
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Vertel iets over jezelf..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MapPin/>Locatie</FormLabel>
                      <FormControl><Input placeholder="bijv. Amsterdam" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tijdzone</FormLabel>
                      <FormControl><Input placeholder="bijv. Europe/Amsterdam" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Globe/>Website</FormLabel>
                      <FormControl><Input placeholder="https://jouw-website.nl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               {currentOrganization && (
                 <>
                    <Separator className="my-4" />
                    <FormField
                        control={profileForm.control}
                        name="skills"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Vaardigheden (voor {currentOrganization.name})</FormLabel>
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
                                            <Checkbox checked={isSelected} className="mr-2" />
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

                    <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2"><Clock/> Werkuren</FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Stel je typische werkuren in om workload en notificaties te verfijnen.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={profileForm.control}
                        name="workingHours.startTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Starttijd</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={profileForm.control}
                        name="workingHours.endTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Eindtijd</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </>
               )}
              
              <div className="pt-4">
                <Button type="submit" disabled={isSubmittingProfile} className="w-full">
                  {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Profiel Opslaan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {currentOrganization && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell/>Notificatie-instellingen</CardTitle>
                <CardDescription>Beheer hier je notificatievoorkeuren voor de organisatie '{currentOrganization.name}'.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="daily-digest" className="font-semibold">Dagelijks Overzicht</Label>
                        <p className="text-sm text-muted-foreground">Ontvang elke dag een in-app notificatie met een samenvatting van je ongelezen meldingen.</p>
                    </div>
                    <Switch
                        id="daily-digest"
                        checked={user.notificationSettings?.dailyDigestEnabled ?? false}
                        onCheckedChange={handleDigestToggle}
                    />
                </div>
                <div className="rounded-lg border p-4">
                    <div className="space-y-0.5">
                    <Label className="font-semibold">Prioriteitsdrempel</Label>
                    <p className="text-sm text-muted-foreground">
                        Ontvang alleen notificaties voor taken met de geselecteerde prioriteit of hoger.
                    </p>
                    </div>
                    <Select
                    value={user.notificationSettings?.notificationPriorityThreshold || 'Laag'}
                    onValueChange={handlePriorityThresholdChange}
                    >
                    <SelectTrigger className="mt-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Laag">Alle meldingen (vanaf Laag)</SelectItem>
                        <SelectItem value="Midden">Midden en hoger</SelectItem>
                        <SelectItem value="Hoog">Hoog en hoger</SelectItem>
                        <SelectItem value="Urgent">Alleen Urgent</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      )}
    </>
  );
}
