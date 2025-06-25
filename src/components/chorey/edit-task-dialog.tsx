
'use client';

import type { User, Label, TaskFormValues, Task, Comment, HistoryEntry, Team } from '@/lib/types';
import { taskFormSchema } from '@/lib/types';
import { useState, type ReactNode, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MessageSquare, History, ClipboardCopy, Bot, Loader2, Speaker } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { handleSummarizeComments, handleMultiSpeakerTextToSpeech } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TaskFormFields } from './task-form-fields';


type EditTaskDialogProps = {
  users: User[];
  task: Task;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const CommentItem = ({ comment, user }: { comment: Comment; user?: User }) => {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback>{user?.name.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{user?.name ?? 'Onbekende gebruiker'}</p>
            <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: nl })}
            </p>
        </div>
        <p className="text-sm text-foreground/90">{comment.text}</p>
      </div>
    </div>
  );
};

const HistoryItem = ({ entry, user }: { entry: HistoryEntry; user?: User }) => {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback>{user?.name.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm">
            <span className="font-semibold">{user?.name ?? 'Systeem'}</span>
            <span> {entry.action.toLowerCase()} </span>
            {entry.details && <span className="text-muted-foreground">({entry.details})</span>}
        </p>
         <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: nl })}
        </p>
      </div>
    </div>
  );
}


export default function EditTaskDialog({ users, task, isOpen, setIsOpen }: EditTaskDialogProps) {
  const { toast } = useToast();
  const { updateTask, addComment } = useTasks();
  const { teams } = useAuth();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const sortedComments = [...(task.comments || [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const sortedHistory = [...(task.history || [])].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId || undefined,
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
      assigneeId: task.assigneeId || undefined,
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
    setSummary('');
    setAudioSrc(null);
    setAudioError(null);
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
  
  const onSummarizeComments = async () => {
    const commentsToSummarize = sortedComments.map(c => c.text);
    if (commentsToSummarize.length < 2) {
      toast({ title: 'Niet genoeg reacties om samen te vatten.', variant: 'destructive' });
      return;
    }
    setIsSummarizing(true);
    setSummary('');
    setAudioError(null);
    setAudioSrc(null);
    const result = await handleSummarizeComments(commentsToSummarize);
    if (result.error) {
      toast({ title: 'Fout bij samenvatten', description: result.error, variant: 'destructive' });
    } else if (result.summary) {
      setSummary(result.summary);
    }
    setIsSummarizing(false);
  };

  const onReadAloud = async () => {
    if (sortedComments.length === 0) {
      toast({ title: 'Geen reacties om voor te lezen.', variant: 'destructive' });
      return;
    }
    setIsReadingAloud(true);
    setAudioSrc(null);
    setAudioError(null);
    setSummary('');

    try {
      const commentsWithNames = sortedComments.map(comment => {
        const user = users.find(u => u.id === comment.userId);
        return {
          userId: comment.userId,
          userName: user?.name || 'Onbekend',
          text: comment.text
        };
      });

      const result = await handleMultiSpeakerTextToSpeech({ comments: commentsWithNames });

      if (result.error) {
        throw new Error(result.error);
      } else if (result.audioDataUri) {
        setAudioSrc(result.audioDataUri);
      }
    } catch (e: any) {
      setAudioError(e.message || 'Er is een onbekende fout opgetreden.');
    } finally {
      setIsReadingAloud(false);
    }
  };


  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

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
                        <ScrollArea className="flex-1 pr-2 space-y-4">
                            {sortedComments.length > 1 && (
                                <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={onSummarizeComments} disabled={isSummarizing || isReadingAloud} className="flex-1">
                                    {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                    Samenvatten
                                </Button>
                                <Button variant="outline" size="sm" onClick={onReadAloud} disabled={isReadingAloud || isSummarizing} className="flex-1">
                                    {isReadingAloud ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Speaker className="mr-2 h-4 w-4" />}
                                    Voorlezen
                                </Button>
                                </div>
                            )}
                            {summary && (
                                <Alert>
                                    <Bot className="h-4 w-4" />
                                    <AlertTitle>AI Samenvatting</AlertTitle>
                                    <AlertDescription>{summary}</AlertDescription>
                                </Alert>
                            )}
                            {audioSrc && (
                                <div className="mt-2">
                                    <audio controls autoPlay src={audioSrc} className="w-full h-10">
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                            {audioError && (
                                <Alert variant="destructive" className="mt-2">
                                    <AlertTitle>Fout bij voorlezen</AlertTitle>
                                    <AlertDescription>{audioError}</AlertDescription>
                                </Alert>
                            )}
                            {sortedComments.length > 0 ? (
                                sortedComments.map(comment => (
                                    <CommentItem key={comment.id} comment={comment} user={users.find(u => u.id === comment.userId)} />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nog geen reacties.</p>
                            )}
                        </ScrollArea>
                        <div className="flex items-start gap-3 mt-auto pt-4 border-t">
                            <Textarea 
                                placeholder="Voeg een reactie toe..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                            />
                            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                                Plaats
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 min-h-0 mt-2">
                        <ScrollArea className="h-full pr-2">
                            <div className="space-y-4">
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map(entry => (
                                        <HistoryItem key={entry.id} entry={entry} user={users.find(u => u.id === entry.userId)} />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Geen geschiedenis.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
