'use client';
import type { Task, User } from '@/lib/types';
import { ALL_STATUSES } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow, isBefore, isToday, startOfDay, isWithinInterval, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Equal,
  Flame,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Edit,
  User as UserIcon,
  Calendar as CalendarIcon,
  Lock,
  XCircle,
  Paperclip,
  Replace,
  Copy,
  MessageSquare,
  Trophy,
  Clock,
  Link as LinkIcon,
  Database,
  CheckCheck,
  Hourglass,
  ClipboardCopy,
  Volume2,
  Loader2,
  Repeat,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/contexts/task-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useMemo } from 'react';
import EditTaskDialog from '@/components/chorey/edit-task-dialog';
import { calculatePoints } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { handleTextToSpeech } from '@/app/actions';


type TaskCardProps = {
  task: Task;
  users: User[];
  isDragging?: boolean;
};

const priorityConfig = {
  Urgent: { icon: Flame, color: 'text-chart-1' },
  Hoog: { icon: ChevronUp, color: 'text-chart-2' },
  Midden: { icon: Equal, color: 'text-chart-3' },
  Laag: { icon: ChevronDown, color: 'text-chart-4' },
};

const statusConfig: Record<Task['status'], { icon?: JSX.Element; color: string }> = {
    'Te Doen': { color: 'border-l-[hsl(var(--status-todo))]' },
    'In Uitvoering': { color: 'border-l-[hsl(var(--status-inprogress))]' },
    'In Review': { icon: <Hourglass className="h-5 w-5 text-[hsl(var(--status-in-review))]" />, color: 'border-l-[hsl(var(--status-in-review))]' },
    'Voltooid': { icon: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-completed))]" />, color: 'border-l-[hsl(var(--status-completed))]' },
    'Gearchiveerd': { icon: <Archive className="h-5 w-5 text-gray-500" />, color: 'border-l-[hsl(var(--status-archived))]' },
    'Geannuleerd': { icon: <XCircle className="h-5 w-5 text-destructive" />, color: 'border-l-destructive' },
};

const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) {
      return <>{text}</>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5 py-px">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };


const TaskCard = ({ task, users, isDragging }: TaskCardProps) => {
  const assignee = users.find((user) => user.id === task.assigneeId);
  const PriorityIcon = priorityConfig[task.priority].icon;
  const statusInfo = statusConfig[task.status];
  const { updateTask, toggleSubtaskCompletion, selectedTaskIds, toggleTaskSelection, cloneTask, deleteTaskPermanently, setViewedUser, searchTerm, tasks: allTasks } = useTasks();
  const { user: currentUser, teams } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const { toast } = useToast();
  
  const team = teams.find((t) => t.id === task.teamId);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const points = calculatePoints(task.priority, task.storyPoints);

  const isSelected = selectedTaskIds.includes(task.id);

  const [dateStatus, setDateStatus] = useState({
    isOverdue: false,
    isDueToday: false,
    isDueSoon: false,
  });

  const isBlocked = useMemo(() => {
    if (!task.blockedBy || task.blockedBy.length === 0) return false;
    return task.blockedBy.some(blockerId => {
      const blockerTask = allTasks.find(t => t.id === blockerId);
      return blockerTask && blockerTask.status !== 'Voltooid';
    });
  }, [task.blockedBy, allTasks]);

  useEffect(() => {
    if (task.dueDate) {
      const today = new Date();
      const overdue = isBefore(startOfDay(task.dueDate), startOfDay(today));
      const dueToday = isToday(task.dueDate);
      const dueSoon = !dueToday && !overdue && isWithinInterval(task.dueDate, { start: today, end: addDays(today, 7) });
      setDateStatus({ isOverdue: overdue, isDueToday: dueToday, isDueSoon: dueSoon });
    }
  }, [task.dueDate]);

  const { isOverdue, isDueToday, isDueSoon } = dateStatus;

  const canApprove = currentUser && task.creatorId && task.creatorId === currentUser.id && task.assigneeId !== currentUser.id;

  const handleCopyId = () => {
    navigator.clipboard.writeText(task.id);
    toast({
        title: "Taak ID Gekopieerd!",
        description: `ID ${task.id} is naar je klembord gekopieerd.`
    })
  }

  const onTextToSpeech = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSynthesizing(true);
    try {
      const result = await handleTextToSpeech(task.title);
      if (result.audioDataUri) {
        const audio = new Audio(result.audioDataUri);
        audio.play();
        audio.onended = () => setIsSynthesizing(false);
      } else {
        throw new Error(result.error || 'Geen audio data ontvangen');
      }
    } catch (error: any) {
      toast({
        title: 'Fout bij spraaksynthese',
        description: error.message || 'Kon de taak niet voorlezen.',
        variant: 'destructive',
      });
      setIsSynthesizing(false);
    }
  };


  return (
    <div className="relative">
       <div className="absolute top-2 left-2 z-10">
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleTaskSelection(task.id)}
                aria-label={`Select task ${task.title}`}
                className='bg-background/80 hover:bg-background'
            />
        </div>
      <Card 
        className={cn(
            'group/task-card hover:shadow-lg transition-shadow duration-200 bg-card border-l-4', 
            statusInfo.color,
            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            isDragging && 'opacity-50',
            isBlocked && 'opacity-60 bg-red-500/10'
        )}
      >
        <CardHeader className="p-3 pb-2 pl-9">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-semibold font-body leading-snug pt-1 flex items-center gap-1.5">
              {task.recurring && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
              <span className="flex-1">
                <Highlight text={task.title} highlight={searchTerm} />
              </span>
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => cloneTask(task.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Klonen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyId}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Kopieer ID
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                      <Replace className="mr-2 h-4 w-4" />
                      <span>Status wijzigen</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                          {ALL_STATUSES.map(status => (
                              <DropdownMenuItem key={status} onClick={() => updateTask(task.id, { status })}>
                                  {status}
                              </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                {task.status === 'Geannuleerd' ? (
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => deleteTaskPermanently(task.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Permanent verwijderen
                  </DropdownMenuItem>
                 ) : (
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => updateTask(task.id, { status: 'Geannuleerd' })}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Annuleren
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
           {isBlocked && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 font-semibold">
                    <LinkIcon className="h-3 w-3" />
                    <span>Geblokkeerd</span>
                </div>
            )}
        </CardHeader>
        <CardContent className="p-3 pt-1 pl-9">
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((label) => (
              <Badge key={label} variant="secondary" className="font-normal text-xs">
                {label}
              </Badge>
            ))}
          </div>
          
          {task.status === 'In Review' && canApprove && (
            <Button
                size="sm"
                className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateTask(task.id, { status: 'Voltooid' })}
            >
                <CheckCheck className="mr-2 h-4 w-4" />
                Goedkeuren & Voltooien
            </Button>
          )}

          {task.attachments.length > 0 && (
            <div className="mb-2 space-y-1 pt-2 mt-2 border-t">
                 {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:underline mt-1"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">{attachment.name}</span>
                    </a>
                  ))}
            </div>
          )}

          {totalSubtasks > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="subtasks" className="border-b-0">
                <AccordionTrigger className="p-0 hover:no-underline [&_svg]:h-4 [&_svg]:w-4">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Subtaken</span>
                      <span>
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    </div>
                    <Progress value={subtaskProgress} className="h-1" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-2">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.completed}
                          onCheckedChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                        />
                        <label
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn("text-sm leading-none cursor-pointer", subtask.completed && "line-through text-muted-foreground")}
                        >
                          {subtask.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-2 flex justify-between items-center text-xs text-muted-foreground pl-9">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full items-center">
                {assignee ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full hover:bg-accent p-0.5 -ml-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        if(assignee) setViewedUser(assignee);
                    }}
                    aria-label={`View profile of ${assignee.name}`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={assignee.avatar} alt={assignee.name} data-ai-hint="person face" />
                      <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                 {team && (
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="truncate">{team.name}</span>
                    </div>
                )}
                {task.dueDate && (
                  <div className={cn('flex items-center gap-1', { 'text-destructive': isOverdue, 'text-orange-500 font-semibold': isDueToday, 'text-yellow-600': isDueSoon })}>
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(task.dueDate, 'd MMM')}</span>
                  </div>
                )}
                <div className={cn('flex items-center gap-1 font-medium', priorityConfig[task.priority].color)}>
                  <PriorityIcon className="h-3 w-3" />
                  <span>{task.priority}</span>
                </div>
                 <div className="flex items-center gap-1 font-medium text-amber-600">
                    <Trophy className="h-3 w-3" />
                    <span>{points}</span>
                </div>
                {task.comments?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments.length}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(task.createdAt, { locale: nl, addSuffix: true })}</span>
                </div>
                {task.storyPoints !== undefined && (
                    <div className="flex items-center gap-1 font-medium">
                        <Database className="h-3 w-3" />
                        <span>{task.storyPoints}</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {task.isPrivate && <Lock className="h-3 w-3" />}
                    {statusInfo.icon && (
                        <div className="ml-auto">{statusInfo.icon}</div>
                    )}
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 ml-1" onClick={onTextToSpeech} disabled={isSynthesizing}>
              {isSynthesizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
            </Button>
        </CardFooter>
      </Card>
      <EditTaskDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen} 
        task={task}
        users={users} 
      />
    </div>
  );
};

export default TaskCard;
