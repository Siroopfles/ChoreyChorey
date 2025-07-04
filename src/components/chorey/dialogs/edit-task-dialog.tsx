
'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useOrganization } from '@/contexts/system/organization-context';
import { usePresence } from '@/contexts/communication/presence-context';
import type { Task, TaskFormValues, Label } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { EditTaskHeader } from './edit-task/EditTaskHeader';
import { EditTaskTabs } from './edit-task/EditTaskTabs';
import { TaskFormFields } from '@/components/chorey/common/task-form-fields';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LiveDescriptionEditor } from '../common/live-description-editor';
import { Poll } from '../common/Poll';
import { Separator } from '@/components/ui/separator';
import { useView } from '@/contexts/system/view-context';
import { updateTaskAction } from '@/app/actions/project/task-crud.actions';
import { handleServerAction } from '@/lib/utils/action-wrapper';
import { useAuth } from '@/contexts/user/auth-context';

type EditTaskDialogProps = {
  task: Task;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function EditTaskDialog({ task, isOpen, setIsOpen }: EditTaskDialogProps) {
  const { toast } = useToast();
  const { users, projects, currentOrganization } = useOrganization();
  const { setViewingTask: setPresenceViewingTask } = usePresence();
  const { user: currentUser } = useAuth();
  const { setViewedTask } = useView();

  const form = useForm<Omit<TaskFormValues, 'description'>>({
    resolver: zodResolver(taskFormSchema.omit({ description: true })),
  });

  useEffect(() => {
    if (task && isOpen) {
      setPresenceViewingTask(task.id);
      form.reset({
        title: task.title,
        assigneeIds: task.assigneeIds || [],
        projectId: task.projectId || undefined,
        dueDate: task.dueDate,
        priority: task.priority,
        labels: task.labels,
        subtasks: (task.subtasks || []).map(({ id, ...rest }) => rest),
        attachments: (task.attachments || []).map(({ id, type, ...rest }) => rest),
        isPrivate: task.isPrivate,
        isSensitive: task.isSensitive,
        helpNeeded: task.helpNeeded,
        storyPoints: task.storyPoints,
        blockedBy: task.blockedBy || [],
        relations: task.relations || [],
        dependencyConfig: task.dependencyConfig || {},
        recurring: task.recurring,
        imageUrl: task.imageUrl,
        reviewerId: task.reviewerId,
        consultedUserIds: task.consultedUserIds || [],
        informedUserIds: task.informedUserIds || [],
        poll: task.poll || undefined,
        customFieldValues: task.customFieldValues,
      });
    }

    return () => {
      if (isOpen) {
        setPresenceViewingTask(null);
      }
    };
  }, [task, isOpen, form, setPresenceViewingTask]);

  const onSubmit = async (data: Omit<TaskFormValues, 'description'>) => {
    if (!currentUser || !currentOrganization) return;
    
    const updatedSubtasks = (data.subtasks || []).map((sub, index) => ({
        ...sub,
        id: task.subtasks[index]?.id || crypto.randomUUID(),
        completed: task.subtasks[index]?.completed || false,
    }));
    
    const updatedAttachments = (data.attachments || []).map((att, index) => ({
        ...att,
        id: task.attachments[index]?.id || crypto.randomUUID(),
        type: 'file' as const,
    }));

    await handleServerAction(
      () => updateTaskAction(task.id, {
        ...data,
        labels: data.labels as Label[],
        subtasks: updatedSubtasks,
        attachments: updatedAttachments,
        blockedBy: data.blockedBy || [],
      }, currentUser.id, currentOrganization.id),
      toast,
      {
        successToast: {
          title: 'Taak Bijgewerkt!',
          description: () => `De taak "${data.title}" is succesvol bijgewerkt.`
        },
        errorContext: 'opslaan taak'
      }
    )
    
    setViewedTask(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <EditTaskHeader task={task} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <LiveDescriptionEditor task={task} />
              {task.poll && (
                <div className="my-4">
                  <Poll taskId={task.id} poll={task.poll} />
                </div>
              )}
              <Separator className="my-4" />
              <FormProvider {...form}>
                <Form {...form}>
                  <form id="edit-task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <TaskFormFields users={users} projects={projects} task={task} />
                  </form>
                </Form>
              </FormProvider>
            </ScrollArea>
            <div className="pt-4 border-t md:border-none md:pt-0 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setViewedTask(null)}>Annuleren</Button>
              <Button type="submit" form="edit-task-form">
                Wijzigingen Opslaan
              </Button>
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <EditTaskTabs task={task} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
