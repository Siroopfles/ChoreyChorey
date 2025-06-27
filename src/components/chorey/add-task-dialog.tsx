
'use client';

import type { User, TaskFormValues, TaskTemplateFormValues } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { type ReactNode, useEffect, useState } from 'react';
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
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskFormFields } from './task-form-fields';
import { Loader2 } from 'lucide-react';

type AddTaskDialogProps = {
  users: User[];
  template?: TaskTemplateFormValues;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddTaskDialog({ users, template, open, onOpenChange }: AddTaskDialogProps) {
  const { toast } = useToast();
  const { addTask } = useTasks();
  const { projects, currentOrganization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultPriority = currentOrganization?.settings?.customization?.priorities?.[1] || 'Midden';

  const defaultFormValues: TaskFormValues = {
    title: '',
    description: '',
    priority: defaultPriority,
    isPrivate: false,
    subtasks: [],
    attachments: [],
    labels: [],
    blockedBy: [],
    recurring: undefined,
    storyPoints: undefined,
    assigneeIds: [],
    projectId: undefined,
    dueDate: undefined,
    imageDataUri: undefined,
  };

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
          recurring: template.recurring,
          attachments: template.attachments,
          isPrivate: template.isPrivate,
          isSensitive: template.isSensitive,
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, template, form, defaultFormValues]);

  async function onSubmit(data: TaskFormValues) {
    setIsSubmitting(true);
    const success = await addTask(data);
    if (success) {
      onOpenChange(false);
      form.reset(defaultFormValues);
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{template ? 'Taak aanmaken met template' : 'Nieuwe Taak Toevoegen'}</DialogTitle>
          <DialogDescription>{template ? `Template: "${template.name}"` : 'Vul de details hieronder in om een nieuwe taak aan te maken.'}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="h-[65vh] pr-6">
                <TaskFormFields users={users} projects={projects} />
              </ScrollArea>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Taak Aanmaken
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

    