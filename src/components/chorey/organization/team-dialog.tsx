
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/user/auth-context';
import { manageTeam } from '@/app/actions/core/team.actions';
import type { Team } from '@/lib/types';

const teamFormSchema = z.object({
  name: z.string().min(2, 'Teamnaam moet minimaal 2 karakters bevatten.'),
});
type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamDialogProps {
  children?: ReactNode;
  team?: Team;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamDialog({ children, team, open: controlledOpen, onOpenChange: controlledOnOpenChange }: TeamDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (team) {
      form.reset({ name: team.name });
    } else {
      form.reset({ name: '' });
    }
  }, [team, open, form]);

  const onSubmit = async (data: TeamFormValues) => {
    if (!currentOrganization || !user) return;
    setIsSubmitting(true);
    
    const action = team ? 'update' : 'create';
    const payload = {
        teamId: team?.id,
        name: data.name
    };

    const result = await manageTeam(action, currentOrganization.id, user.id, payload);
    
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Gelukt!', description: `Team '${data.name}' is ${team ? 'bijgewerkt' : 'aangemaakt'}.`});
        setOpen(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? 'Team Bewerken' : 'Nieuw Team Aanmaken'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teamnaam</FormLabel>
                  <FormControl>
                    <Input placeholder="bijv. Frontend Developers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {team ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
