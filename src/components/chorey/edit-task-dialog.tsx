
'use client';

import type { User, TaskFormValues, Task, Label, Project } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { MessageSquare, History, ClipboardCopy, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { TaskFormFields } from './task-form-fields';
import { TaskComments } from './task-comments';
import { TaskHistory } from './task-history';
import { addCommentAction } from '@/app/actions/comment.actions';
import { useNotifications } from '@/contexts/notification-context';
import { useCall } from '@/contexts/call-context';
import { LiveDescriptionEditor } from './live-description-editor';
import { Separator } from '../ui/separator';


type EditTaskDialogProps = {
  users: User[];
  task: Task;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function EditTaskDialog({ task, isOpen, setIsOpen }: EditTaskDialogProps) {
  const { toast } = useToast();
  const { updateTask } = useTasks();
  const { markSingleNotificationAsRead } = useNotifications();
  const { user: currentUser } = useAuth();
  const { users, projects, currentOrganization } = useOrganization();
  const { startOrJoinCall, leaveCall, activeCall } = useCall();

  const isHuddleActive = task.callSession?.isActive;
  const isInThisHuddle = activeCall?.taskId === task.id;

  const form = useForm<Omit<TaskFormValues, 'description'>>({
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    if (task && isOpen) {
      form.reset({
        title: task.title,
        assigneeIds: task.assigneeIds || [],
        projectId: task.projectId || undefined,
        dueDate: task.dueDate,
        priority: task.priority,
        labels: task.labels,
        subtasks: task.subtasks.map(({id, ...rest}) => rest),
        attachments: task.attachments.map(({id, type, ...rest}) => rest),
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
      });
    }
  }, [task, isOpen, form]);


  function onSubmit(data: Omit<TaskFormValues, 'description'>) {
    const updatedSubtasks = data.subtasks?.map((sub, index) => ({
        ...sub,
        id: task.subtasks[index]?.id || crypto.randomUUID(),
        completed: task.subtasks[index]?.completed || false,
    })) || [];
    
    const updatedAttachments = data.attachments?.map((att, index) => ({
        ...att,
        id: task.attachments[index]?.id || crypto.randomUUID(),
        type: 'file' as const,
    })) || [];

    updateTask(task.id, {
        ...data,
        labels: data.labels as Label[],
        subtasks: updatedSubtasks,
        attachments: updatedAttachments,
        blockedBy: data.blockedBy || [],
    });

    toast({
      title: 'Taak Bijgewerkt!',
      description: `De taak "${data.title}" is succesvol bijgewerkt.`,
    });
    setIsOpen(false);
  }
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(task.id);
    toast({
        title: "Taak ID Gekopieerd!",
        description: `ID ${task.id} is naar je klembord gekopieerd.`
    })
  }

  const handleAddComment = (text: string) => {
    if (!currentUser || !currentOrganization) return;
    addCommentAction(task.id, text, currentUser.id, currentUser.name, currentOrganization.id);
  }

  const handleMarkCommentAsRead = (commentId: string) => {
    if (!currentUser) return;
    // This is handled by the notification system now.
    // The presence of this function is kept for components that might still call it.
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <DialogTitle className="font-headline flex items-center gap-2">
                <span>Taak Bewerken: {task.title}</span>
                <Badge variant="outline">{task.status}</Badge>
              </DialogTitle>
              <DialogDescription>
                <button onClick={handleCopyId} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ID: {task.id}
                    <ClipboardCopy className="h-3 w-3" />
                </button>
              </DialogDescription>
            </div>
            <Button
                variant={isHuddleActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => isInThisHuddle ? leaveCall() : startOrJoinCall(task)}
                className="shrink-0"
            >
                {isInThisHuddle ? <PhoneOff className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
                {isInThisHuddle ? 'Verlaat Huddle' : (isHuddleActive ? 'Neem Deel' : 'Start Huddle')}
            </Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1 min-h-0">
            <div className="flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <LiveDescriptionEditor task={task} />
                <Separator className="my-4" />
                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <TaskFormFields users={users} projects={projects} task={task} />
                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <DialogClose asChild>
                              <Button type="button" variant="ghost">
                                  Annuleren
                              </Button>
                          </DialogClose>
                          <Button type="submit" data-cy="save-task-button">Wijzigingen Opslaan</Button>
                      </div>
                  </form>
                </FormProvider>
              </ScrollArea>
            </div>
            <div className="flex flex-col min-h-0">
                <Tabs defaultValue="comments" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4"/> Reacties</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/> Geschiedenis</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="flex-1 flex flex-col gap-4 min-h-0 mt-2">
                        <TaskComments 
                            task={task}
                            users={users}
                            addComment={handleAddComment}
                        />
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 min-h-0 mt-2">
                        <TaskHistory task={task} users={users} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
