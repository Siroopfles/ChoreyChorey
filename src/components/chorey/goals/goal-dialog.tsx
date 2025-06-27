'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PersonalGoal, PersonalGoalFormValues } from '@/lib/types';
import { personalGoalFormSchema } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, PlusCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: PersonalGoal;
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const { addPersonalGoal, updatePersonalGoal } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PersonalGoalFormValues>({
    resolver: zodResolver(personalGoalFormSchema),
    defaultValues: goal ? {
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      milestones: goal.milestones.map(({ text }) => ({ text })),
    } : {
      title: '',
      description: '',
      targetDate: undefined,
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  const onSubmit = async (data: PersonalGoalFormValues) => {
    setIsSubmitting(true);
    let success = false;
    if (goal) {
      success = await updatePersonalGoal(goal.id, data);
    } else {
      success = await addPersonalGoal(data);
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
          <DialogTitle>{goal ? 'Doel Bewerken' : 'Nieuw Persoonlijk Doel'}</DialogTitle>
          <DialogDescription>
            Stel een persoonlijk doel in om je voortgang bij te houden.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Titel</FormLabel><FormControl><Input placeholder="bijv. Leer gitaar spelen" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Omschrijving</FormLabel><FormControl><Textarea placeholder="Waarom is dit doel belangrijk voor je?" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="targetDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Doeldatum</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'PPP') : <span>Kies een datum</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />

                <div>
                  <FormLabel>Mijlpalen</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`milestones.${index}.text`} render={({ field }) => (
                          <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}><PlusCircle className="mr-2 h-4 w-4" />Mijlpaal toevoegen</Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t mt-4">
              <DialogClose asChild><Button type="button" variant="ghost">Annuleren</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {goal ? 'Doel Opslaan' : 'Doel Aanmaken'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
