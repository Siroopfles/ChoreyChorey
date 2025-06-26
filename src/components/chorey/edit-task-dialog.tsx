'use client';

import type { User, TaskFormValues, Task, Label, Team } from '@/lib/types';
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
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { MessageSquare, History, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { TaskFormFields } from './task-form-fields';
import { TaskComments } from './task-comments';
import { TaskHistory } from './task-history';


type EditTaskDialogProps = {
  users: User[];
  task: Task;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function EditTaskDialog({ users, task, isOpen, setIsOpen }: EditTaskDialogProps) {
  const { toast } = useToast();
  const { updateTask, addComment } = useTasks();
  const { teams } = useAuth();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      assigneeIds: task.assigneeIds || [],
      teamId: task.teamId || undefined,
      dueDate: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      subtasks: task.subtasks.map(({id, ...rest}) => rest),
      attachments: task.attachments.map(({id, type, ...rest}) => rest),
      isPrivate: task.isPrivate,
      storyPoints: task.storyPoints,
      blockedBy: task.blockedBy || [],
      recurring: task.recurring,
      imageDataUri: task.imageDataUri,
    },
  });

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description,
      assigneeIds: task.assigneeIds || [],
      teamId: task.teamId || undefined,
      dueDate: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      subtasks: task.subtasks.map(({id, ...rest}) => rest),
      attachments: task.attachments.map(({id, type, ...rest}) => rest),
      isPrivate: task.isPrivate,
      storyPoints: task.storyPoints,
      blockedBy: task.blockedBy || [],
      recurring: task.recurring,
      imageDataUri: task.imageDataUri,
    });
  }, [task, form, isOpen]);


  function onSubmit(data: TaskFormValues) {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
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
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1 min-h-0">
            <FormProvider {...form}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <TaskFormFields users={users} teams={teams} />
                    </ScrollArea>
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Annuleren
                        </Button>
                        <Button type="submit">Wijzigingen Opslaan</Button>
                    </div>
                </form>
              </Form>
            </FormProvider>
            <div className="flex flex-col min-h-0">
                <Tabs defaultValue="comments" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4"/> Reacties</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/> Geschiedenis</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="flex-1 flex flex-col gap-4 min-h-0 mt-2">
                        <TaskComments 
                            taskId={task.id}
                            comments={task.comments}
                            users={users}
                            addComment={addComment}
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