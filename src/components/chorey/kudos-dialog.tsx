
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { transferPoints } from '@/app/actions/gamification.actions';
import type { User } from '@/lib/types';

const kudosSchema = z.object({
  amount: z.coerce.number().int().positive("Je moet minimaal 1 punt geven."),
  message: z.string().optional(),
});

type KudosFormValues = z.infer<typeof kudosSchema>;

export function KudosDialog({
  open,
  onOpenChange,
  recipient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: User;
}) {
  const { user: sender, currentOrganization, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<KudosFormValues>({
    resolver: zodResolver(kudosSchema),
    defaultValues: { amount: 10, message: '' },
  });
  
  const onSubmit = async (data: KudosFormValues) => {
    if (!sender || !currentOrganization) return;
    setIsSubmitting(true);
    
    const result = await transferPoints(currentOrganization.id, sender.id, recipient.id, data.amount, data.message || '', sender.name);
    
    if (result.error) {
        toast({ title: 'Fout', description: result.error, variant: 'destructive' });
    } else {
        toast({ title: 'Kudos Verzonden!', description: `Je hebt ${data.amount} punten naar ${recipient.name} gestuurd.`});
        await refreshUser();
        onOpenChange(false);
        form.reset();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stuur Kudos naar {recipient.name}</DialogTitle>
          <DialogDescription>
            Geef een deel van je punten als blijk van waardering. Je hebt momenteel {(sender?.points || 0).toLocaleString()} punten.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aantal punten</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={sender?.points || 0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bericht (optioneel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="bijv. Bedankt voor je hulp!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Annuleren</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                    Verstuur Kudos
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
