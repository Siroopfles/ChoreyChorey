'use client';

import type { User, Label, TaskFormValues, Task, Comment, HistoryEntry } from '@/lib/types';
import { ALL_LABELS, taskFormSchema } from '@/lib/types';
import { useState, type ReactNode, useEffect } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label as UiLabel } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar as CalendarIcon, User as UserIcon, PlusCircle, Trash2, Bot, Loader2, Tags, Check, X, MessageSquare, History, ClipboardCopy, Image as ImageIcon, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useTasks } from '@/contexts/task-context';
import { handleSuggestSubtasks, handleSummarizeComments, handleSuggestStoryPoints, handleGenerateTaskImage } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSuggestingPoints, setIsSuggestingPoints] = useState(false);
  const [pointsSuggestion, setPointsSuggestion] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [newComment, setNewComment] = useState('');

  const sortedComments = [...(task.comments || [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const sortedHistory = [...(task.history || [])].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId || undefined,
      dueDate: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      subtasks: task.subtasks.map(({id, ...rest}) => rest),
      attachments: task.attachments.map(({id, type, ...rest}) => rest),
      isPrivate: task.isPrivate,
      storyPoints: task.storyPoints,
      blockedBy: task.blockedBy || [],
      recurring: task.recurring,
    },
  });

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId || undefined,
      dueDate: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      subtasks: task.subtasks.map(({id, ...rest}) => rest),
      attachments: task.attachments.map(({id, type, ...rest}) => rest),
      isPrivate: task.isPrivate,
      storyPoints: task.storyPoints,
      blockedBy: task.blockedBy || [],
      recurring: task.recurring,
    });
    setSummary('');
    setPointsSuggestion('');
  }, [task, form, isOpen]);

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  });
  
  const { fields: blockedByFields, append: appendBlockedBy, remove: removeBlockedBy } = useFieldArray({
    control: form.control,
    name: "blockedBy",
  });

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
  
  const onSuggestSubtasks = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({
            title: 'Titel vereist',
            description: 'Voer een titel in om subtaken te kunnen genereren.',
            variant: 'destructive',
        });
        return;
    }

    setIsSuggestingSubtasks(true);
    const result = await handleSuggestSubtasks(title, description);

    if (result.error) {
        toast({
            title: 'Fout bij suggereren',
            description: result.error,
            variant: 'destructive'
        });
    } else if (result.subtasks) {
        result.subtasks.forEach(subtask => appendSubtask({ text: subtask }));
        toast({
            title: 'Subtaken toegevoegd!',
            description: `${result.subtasks.length} subtaken zijn door AI gegenereerd.`,
        });
    }
    setIsSuggestingSubtasks(false);
  };
  
   const onSuggestStoryPoints = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
     if (!title) {
        toast({
            title: 'Titel vereist',
            description: 'Voer een titel in om Story Points te kunnen genereren.',
            variant: 'destructive',
        });
        return;
    }
    setIsSuggestingPoints(true);
    const result = await handleSuggestStoryPoints(title, description);
    if (result.error) {
        toast({
            title: 'Fout bij suggereren',
            description: result.error,
            variant: 'destructive'
        });
    } else if (result.suggestion) {
        form.setValue('storyPoints', result.suggestion.points);
        setPointsSuggestion(result.suggestion.reasoning);
    }
    setIsSuggestingPoints(false);
  }
  
  const onSummarizeComments = async () => {
    const commentsToSummarize = sortedComments.map(c => c.text);
    if (commentsToSummarize.length === 0) {
      toast({ title: 'Geen reacties om samen te vatten.', variant: 'destructive' });
      return;
    }

    setIsSummarizing(true);
    setSummary('');
    const result = await handleSummarizeComments(commentsToSummarize);
    if (result.error) {
      toast({ title: 'Fout bij samenvatten', description: result.error, variant: 'destructive' });
    } else if (result.summary) {
      setSummary(result.summary);
    }
    setIsSummarizing(false);
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

  const onGenerateImage = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    if (!title) {
        toast({ title: 'Titel is vereist om een afbeelding te genereren.', variant: 'destructive' });
        return;
    }
    setIsGeneratingImage(true);
    try {
        const result = await handleGenerateTaskImage({ title, description });
        if (result.imageDataUri) {
            appendAttachment({ name: 'AI Afbeelding - ' + title, url: result.imageDataUri });
            toast({ title: 'Afbeelding gegenereerd en toegevoegd als bijlage!' });
        } else {
            throw new Error(result.error || 'Geen afbeeldingsdata ontvangen.');
        }
    } catch (error: any) {
        toast({ title: 'Fout bij genereren afbeelding', description: error.message, variant: 'destructive' });
    }
    setIsGeneratingImage(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh]">
            <ScrollArea className="pr-2">
                <FormProvider {...form}>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                            <Input placeholder="bijv., Stofzuig de woonkamer" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Omschrijving</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Voeg een meer gedetailleerde omschrijving toe..." className="resize-none" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="assigneeId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Toegewezen aan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Selecteer een persoon" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Einddatum</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    {field.value ? format(field.value, 'PPP') : <span>Kies een datum</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prioriteit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecteer een prioriteit" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Laag">Laag</SelectItem>
                                <SelectItem value="Midden">Midden</SelectItem>
                                <SelectItem value="Hoog">Hoog</SelectItem>
                                <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="labels"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Labels</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                                    <Tags className="mr-2 h-4 w-4" />
                                    {field.value?.length > 0 ? `${field.value.length} geselecteerd` : 'Selecteer labels'}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Zoek label..." />
                                <CommandList>
                                    <CommandEmpty>Geen label gevonden.</CommandEmpty>
                                    <CommandGroup>
                                    {ALL_LABELS.map((label) => {
                                        const isSelected = field.value?.includes(label);
                                        return (
                                        <CommandItem
                                            key={label}
                                            onSelect={() => {
                                            if (isSelected) {
                                                field.onChange(field.value?.filter((l) => l !== label));
                                            } else {
                                                field.onChange([...(field.value || []), label]);
                                            }
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                                            {label}
                                        </CommandItem>
                                        );
                                    })}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                            <div className="pt-1 h-fit min-h-[22px]">
                            {field.value?.map((label) => (
                                <Badge
                                variant="secondary"
                                key={label}
                                className="mr-1 mb-1"
                                >
                                {label}
                                <button
                                    type="button"
                                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    }}
                                    onClick={() => field.onChange(field.value?.filter((l) => l !== label))}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                                </Badge>
                            ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="storyPoints"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Story Points</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input type="number" placeholder="bijv. 5" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={onSuggestStoryPoints} disabled={isSuggestingPoints}>
                                        {isSuggestingPoints ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                                    </Button>
                                </div>
                                {pointsSuggestion && <Alert className="mt-2"><AlertDescription>{pointsSuggestion}</AlertDescription></Alert>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="recurring"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Herhaling</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                                <FormControl>
                                <SelectTrigger>
                                    <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Niet herhalend" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="none">Niet herhalend</SelectItem>
                                <SelectItem value="daily">Dagelijks</SelectItem>
                                <SelectItem value="weekly">Wekelijks</SelectItem>
                                <SelectItem value="monthly">Maandelijks</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>
                    
                    <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Privé taak</FormLabel>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    
                    <Separator />

                    <div>
                    <UiLabel>Subtaken</UiLabel>
                    <div className="space-y-2 mt-2">
                        {subtaskFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                            control={form.control}
                            name={`subtasks.${index}.text`}
                            render={({ field }) => (
                                <Input {...field} placeholder="Beschrijf subtaak..."/>
                            )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        ))}
                        <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => appendSubtask({ text: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Subtaak toevoegen
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onSuggestSubtasks}
                            disabled={isSuggestingSubtasks}
                        >
                            {isSuggestingSubtasks ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Bot className="mr-2 h-4 w-4" />
                            )}
                            Genereer (AI)
                        </Button>
                        </div>
                    </div>
                    </div>

                    <Separator />

                    <div>
                    <UiLabel>Bijlagen</UiLabel>
                    <div className="space-y-2 mt-2">
                        {attachmentFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                             <FormField
                                control={form.control}
                                name={`attachments.${index}.name`}
                                render={({ field }) => (
                                <Input {...field} placeholder="Naam bijlage" className="w-1/3"/>
                                )}
                            />
                            <FormField
                            control={form.control}
                            name={`attachments.${index}.url`}
                            render={({ field }) => (
                                <Input {...field} placeholder="https://..."/>
                            )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        ))}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => appendAttachment({ name: '', url: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Bijlage toevoegen
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={onGenerateImage} disabled={isGeneratingImage}>
                                {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                Genereer Afbeelding (AI)
                            </Button>
                        </div>
                    </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                    <UiLabel>Geblokkeerd door (Taak ID)</UiLabel>
                    <div className="space-y-2 mt-2">
                        {blockedByFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name={`blockedBy.${index}`}
                                render={({ field }) => (
                                    <Input {...field} value={field.value ?? ''} placeholder="Plak een taak ID..."/>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeBlockedBy(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendBlockedBy('')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Blocker toevoegen
                        </Button>
                    </div>
                </div>

                    <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-2 px-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                        Annuleren
                    </Button>
                    <Button type="submit">Wijzigingen Opslaan</Button>
                    </DialogFooter>
                </form>
                </Form>
            </FormProvider>
            </ScrollArea>
            <div className="flex flex-col">
                <Tabs defaultValue="comments" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4"/> Reacties</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/> Geschiedenis</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="flex-1 flex flex-col gap-4 min-h-0 mt-2">
                        <div className="flex-1 space-y-4 pr-2 overflow-y-auto">
                            {sortedComments.length > 1 && (
                                <Button variant="outline" size="sm" onClick={onSummarizeComments} disabled={isSummarizing} className="w-full">
                                    {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                    Samenvatten
                                </Button>
                            )}
                            {summary && (
                                <Alert>
                                    <AlertTitle>AI Samenvatting</AlertTitle>
                                    <AlertDescription>{summary}</AlertDescription>
                                </Alert>
                            )}
                            {sortedComments.length > 0 ? (
                                sortedComments.map(comment => (
                                    <CommentItem key={comment.id} comment={comment} user={users.find(u => u.id === comment.userId)} />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nog geen reacties.</p>
                            )}
                        </div>
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
