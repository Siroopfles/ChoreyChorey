'use client';

import type { User, TaskFormValues, TaskTemplateFormValues } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { useState, type ReactNode, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskFormFields } from './task-form-fields';

type AddTaskDialogProps = {
  users: User[];
  children: ReactNode;
  template?: TaskTemplateFormValues;
};

const defaultFormValues: TaskFormValues = {
  title: '',
  description: '',
  priority: 'Midden',
  isPrivate: false,
  subtasks: [],
  attachments: [],
  labels: [],
  blockedBy: [],
  recurring: undefined,
  storyPoints: undefined,
  assigneeId: undefined,
  teamId: undefined,
  dueDate: undefined,
};

export default function AddTaskDialog({ users, children, template }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addTask } = useTasks();
  const { teams } = useAuth();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      if (template) {
        form.reset({
          ...defaultFormValues,
          title: template.title,
          description: template.description,
          priority: template.priority,
          labels: template.labels,
          subtasks: template.subtasks,
          storyPoints: template.storyPoints,
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, template, form]);

  function onSubmit(data: TaskFormValues) {
    addTask(data);
    toast({
      title: 'Taak Aangemaakt!',
      description: `De taak "${data.title}" is succesvol aangemaakt.`,
    });
    setOpen(false);
    form.reset(defaultFormValues);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{template ? 'Taak aanmaken met template' : 'Nieuwe Taak Toevoegen'}</DialogTitle>
          <DialogDescription>{template ? `Template: "${template.name}"` : 'Vul de details hieronder in om een nieuwe taak aan te maken.'}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="h-[65vh] pr-6">
                <TaskFormFields users={users} teams={teams} />
              </ScrollArea>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">Taak Aanmaken</Button>
              </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
