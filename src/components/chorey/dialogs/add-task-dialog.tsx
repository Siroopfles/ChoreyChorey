
'use client';

import type { User, TaskFormValues, TaskTemplate } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { type ReactNode, useEffect, useState, useMemo } from 'react';
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
  DialogClose,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/feature/task-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskFormFields } from '@/components/chorey/common/task-form-fields';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleServerAction } from '@/lib/utils/action-wrapper';
import { createTaskAction } from '@/app/actions/project/task-crud.actions';
import { useAuth } from '@/contexts/user/auth-context';

type AddTaskDialogProps = {
  template?: TaskTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddTaskDialog({ template, open, onOpenChange }: AddTaskDialogProps) {
  const { toast } = useToast();
  const { users, projects, currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const defaultPriority = currentOrganization?.settings?.customization?.priorities?.[1]?.name || 'Midden';

  const defaultFormValues = useMemo(() => ({
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
    imageUrl: undefined,
  }), [defaultPriority]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      const shouldAddTaskFromUrl = searchParams.get('addTask') === 'true';

      if (shouldAddTaskFromUrl) {
          const title = searchParams.get('title');
          const url = searchParams.get('url');
          const text = searchParams.get('text');

          let description = '';
          if (text) {
            description += `<p>${decodeURIComponent(text)}</p>`;
          }
          if (url) {
            const decodedUrl = decodeURIComponent(url);
            description += `<p><a href="${decodedUrl}" target="_blank" rel="noopener noreferrer">${decodedUrl}</a></p>`;
          }

          form.reset({
              ...defaultFormValues,
              title: title ? decodeURIComponent(title) : '',
              description: description,
          });
          
          const newPath = window.location.pathname;
          router.replace(newPath, { scroll: false });

      } else if (template) {
        form.reset({
          ...defaultFormValues,
          title: template.title,
          description: template.description,
          priority: template.priority,
          labels: template.labels,
          subtasks: template.subtasks.map(s => ({text: s.text, isPrivate: false})),
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
  }, [open, template, form, defaultFormValues, searchParams, router]);

  async function onSubmit(data: TaskFormValues) {
    if (!currentUser || !currentOrganization) return;
    setIsSubmitting(true);
    
    const result = await handleServerAction(
      () => createTaskAction(currentOrganization.id, currentUser.id, currentUser.name, data),
      toast,
      {
        successToast: {
          title: 'Taak Aangemaakt!',
          description: () => `De taak "${data.title}" is aangemaakt.`,
        },
        errorContext: 'opslaan taak',
      }
    );

    if (!result.error) {
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
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={isSubmitting}>
                    Annuleren
                  </Button>
                </DialogClose>
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
