

'use client';

import type { User, TaskFormValues, Task, Label, Project } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';
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
import { MessageSquare, History, ClipboardCopy, Phone, PhoneOff, PenSquare, QrCode } from 'lucide-react';
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
import { Poll } from './Poll';
import { usePresence } from '@/contexts/presence-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskQrCodeDialog } from './TaskQrCodeDialog';
import Link from 'next/link';


const LiveViewers = ({ taskId }: { taskId: string }) => {
    const { user: currentUser } = useAuth();
    const { users } = useOrganization();
    const { others } = usePresence();

    const viewers = useMemo(() => 
        Object.values(others)
            .filter(p => p.viewingTaskId === taskId && p.id !== currentUser?.id)
            .map(p => users.find(u => u.id === p.id))
            .filter(Boolean) as User[],
        [others, taskId, users, currentUser]
    );

    if (viewers.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center -space-x-2">
            <TooltipProvider>
                {viewers.slice(0, 3).map(viewer => (
                    <Tooltip key={viewer.id}>
                        <TooltipTrigger asChild>
                             <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={viewer.avatar} />
                                <AvatarFallback>{viewer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{viewer.name} bekijkt dit ook</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
            {viewers.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                    +{viewers.length - 3}
                </div>
            )}
        </div>
    );
};


type EditTaskDialogProps = {
  users: User[];
  task: Task;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function EditTaskDialog({ task, isOpen, setIsOpen }: EditTaskDialogProps) {
  const { toast } = useToast();
  const { updateTask, toggleCommentReaction } = useTasks();
  const { markSingleNotificationAsRead } = useNotifications();
  const { user: currentUser } = useAuth();
  const { users, projects, currentOrganization } = useOrganization();
  const { startOrJoinCall, leaveCall, activeCall } = useCall();
  const { setViewingTask } = usePresence();
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);

  const isHuddleActive = task.callSession?.isActive;
  const isInThisHuddle = activeCall?.taskId === task.id;

  const form = useForm<Omit<TaskFormValues, 'description'>>({
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    if (task && isOpen) {
      setViewingTask(task.id);
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
        poll: task.poll || undefined,
      });
    }

    return () => {
        // This cleanup function runs when the component unmounts or dependencies change.
        // We only clear the viewing state if the dialog was open and is now closing.
        if (isOpen) {
            setViewingTask(null);
        }
    };
  }, [task, isOpen, form, setViewingTask]);


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

  const handleAddComment = (text: string, parentId: string | null = null) => {
    if (!currentUser || !currentOrganization) return;
    addCommentAction(task.id, text, currentUser.id, currentUser.name, currentOrganization.id, parentId);
  }

  const handleMarkCommentAsRead = (commentId: string) => {
    if (!currentUser) return;
    // This action is now handled by the notification system now.
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
             <div className="flex items-center gap-2">
                <LiveViewers taskId={task.id} />
                 <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsQrCodeOpen(true)}>
                    <QrCode className="h-4 w-4" />
                </Button>
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
          </div>
        </DialogHeader>
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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4"/> Reacties</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/> Geschiedenis</TabsTrigger>
                        <TabsTrigger value="whiteboard"><PenSquare className="mr-2 h-4 w-4"/> Whiteboard</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="flex-1 flex flex-col gap-4 min-h-0 mt-2">
                        <TaskComments 
                            task={task}
                            users={users}
                            addComment={handleAddComment}
                            toggleCommentReaction={toggleCommentReaction}
                        />
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 min-h-0 mt-2">
                        <TaskHistory task={task} users={users} />
                    </TabsContent>
                    <TabsContent value="whiteboard" className="flex-1 min-h-0 mt-2 flex flex-col items-center justify-center text-center gap-4 p-4">
                      <h3 className="font-semibold text-lg">Open Whiteboard</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                          Werk samen op een volledig scherm canvas. Ideaal voor brainstormsessies en het visualiseren van ideeën.
                      </p>
                      <Button asChild>
                          <Link href={`/dashboard/whiteboard/${task.id}`} target="_blank">
                              <PenSquare className="mr-2 h-4 w-4" />
                              Open in Nieuw Tabblad
                          </Link>
                      </Button>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        <TaskQrCodeDialog
            open={isQrCodeOpen}
            onOpenChange={setIsQrCodeOpen}
            taskId={task.id}
            taskTitle={task.title}
        />
      </DialogContent>
    </Dialog>
  );
}
