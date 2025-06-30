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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useOrganization } from '@/contexts/organization-context';
import type { Task, User } from '@/lib/types';

const handoffSchema = z.object({
  toUserId: z.string().min(1, 'Selecteer een teamlid.'),
  message: z.string().optional(),
});
type HandoffFormValues = z.infer<typeof handoffSchema>;

interface HandoffTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  currentUser: User;
}

export function HandoffTaskDialog({ open, onOpenChange, task, currentUser }: HandoffTaskDialogProps) {
  const { handOffTask } = useTasks();
  const { users } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<HandoffFormValues>({
    resolver: zodResolver(handoffSchema),
    defaultValues: { toUserId: undefined, message: '' },
  });

  const availableUsers = users.filter(u => u.id !== currentUser.id);

  const onSubmit = async (data: HandoffFormValues) => {
    setIsSubmitting(true);
    const success = await handOffTask(task.id, currentUser.id, data.toUserId, data.message);
    if (success) {
      toast({ title: 'Taak Overgedragen!', description: `De taak is succesvol overgedragen.` });
      onOpenChange(false);
      form.reset();
    }
    // Error is handled in context
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Taak Overdragen: {task.title}</DialogTitle>
          <DialogDescription>
            Geef deze taak door aan een ander teamlid.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geef door aan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een teamlid..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overdrachtsbericht (optioneel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Korte context of statusupdate..." {...field} />
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
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Overdragen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
