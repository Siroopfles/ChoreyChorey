
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { IdeaFormValues } from '@/lib/types';
import { ideaFormSchema } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lightbulb } from 'lucide-react';

interface IdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeaDialog({ open, onOpenChange }: IdeaDialogProps) {
  const { addIdea } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: IdeaFormValues) => {
    setIsSubmitting(true);
    const success = await addIdea(data);
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
          <DialogTitle>Deel je Idee</DialogTitle>
          <DialogDescription>
            Wat is jouw briljante idee om Chorey te verbeteren?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Titel van het idee</FormLabel><FormControl><Input placeholder="bijv. Integratie met slimme koelkasten" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Omschrijving</FormLabel><FormControl><Textarea placeholder="Beschrijf je idee zo gedetailleerd mogelijk. Welk probleem lost het op?" {...field} rows={6} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Idee Indienen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
