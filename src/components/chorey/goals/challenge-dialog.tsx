'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TeamChallenge, TeamChallengeFormValues } from '@/lib/types';
import { teamChallengeFormSchema } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trophy, Users, Hash, CheckCircle, Save } from 'lucide-react';

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge?: TeamChallenge;
}

export function ChallengeDialog({ open, onOpenChange, challenge }: ChallengeDialogProps) {
  const { addTeamChallenge, updateTeamChallenge } = useTasks();
  const { teams } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamChallengeFormValues>({
    resolver: zodResolver(teamChallengeFormSchema),
    defaultValues: challenge ? {
      title: challenge.title,
      description: challenge.description,
      teamId: challenge.teamId,
      metric: challenge.metric,
      target: challenge.target,
      reward: challenge.reward,
    } : {
      title: '',
      description: '',
      metric: 'points_earned',
    },
  });

  const onSubmit = async (data: TeamChallengeFormValues) => {
    setIsSubmitting(true);
    let success = false;
    if (challenge) {
      success = await updateTeamChallenge(challenge.id, data);
    } else {
      success = await addTeamChallenge(data);
    }
    if (success) {
      onOpenChange(false);
      form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{challenge ? 'Uitdaging Bewerken' : 'Nieuwe Teamuitdaging'}</DialogTitle>
          <DialogDescription>
            Stel een doel in voor een team en beloon ze met punten als ze het halen.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Titel</FormLabel><FormControl><Input placeholder="bijv. De Grote Voorjaarsschoonmaak" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Omschrijving</FormLabel><FormControl><Textarea placeholder="Beschrijf het doel van de uitdaging." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Team</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <Users className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Selecteer een team..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                {team.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="metric"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Doel meten op</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="points_earned"><Trophy className="mr-2 h-4 w-4"/> Verdiende Punten</SelectItem>
                                    <SelectItem value="tasks_completed"><CheckCircle className="mr-2 h-4 w-4"/> Voltooide Taken</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField control={form.control} name="target" render={({ field }) => (
                        <FormItem><FormLabel>Doelwaarde</FormLabel><FormControl><Input type="number" placeholder="bijv. 1000" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                </div>
                 <FormField control={form.control} name="reward" render={({ field }) => (
                    <FormItem><FormLabel>Beloning (totaal punten)</FormLabel><FormControl><Input type="number" placeholder="bijv. 500" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t mt-4">
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {challenge ? 'Uitdaging Opslaan' : 'Uitdaging Starten'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
