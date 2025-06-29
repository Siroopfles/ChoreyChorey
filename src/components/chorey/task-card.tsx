
'use client';
import type { Task, User, Project, Subtask, Comment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { isBefore, isToday, startOfDay, isWithinInterval, addDays, isAfter, addHours } from 'date-fns';
import {
  CheckCircle2,
  MoreVertical,
  Trash2,
  Lock,
  Replace,
  Copy,
  Repeat,
  Heart,
  TimerOff,
  RefreshCw,
  EyeOff,
  Star,
  Divide,
  Eye,
  Crosshair,
  HandHeart,
  Bell,
  BellOff,
  ClipboardCopy,
  CornerUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { getAttachmentSource } from '@/lib/utils';
import { AttachmentIcon } from './attachment-icons';
import { TaskCardFooter } from './task-card-footer';


type TaskCardProps = {
  task: Task;
  users: User[];
  isDragging?: boolean;
  currentUser: User | null;
  projects: Project[];
};

const statusConfig: Record<string, { color: string }> = {
    'Te Doen': { color: 'border-l-[hsl(var(--status-todo))]' },
    'In Uitvoering': { color: 'border-l-[hsl(var(--status-inprogress))]' },
    'In Review': { color: 'border-l-[hsl(var(--status-in-review))]' },
    'Voltooid': { color: 'border-l-[hsl(var(--status-completed))]' },
    'Gearchiveerd': { color: 'border-l-[hsl(var(--status-archived))]' },
    'Geannuleerd': { color: 'border-l-destructive' },
};

const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim() || text.startsWith('[')) { // Don't highlight masked tasks
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


const TaskCard = ({ task, users, isDragging, currentUser, projects }: TaskCardProps) => {
  const statusInfo = statusConfig[task.status] || { color: 'border-l-muted' };
  const { updateTask, toggleSubtaskCompletion, selectedTaskIds, toggleTaskSelection, cloneTask, splitTask, deleteTaskPermanently, searchTerm, tasks: allTasks, thankForTask, toggleTaskTimer, rateTask, resetSubtasks, setChoreOfTheWeek, toggleMuteTask, setViewedTask, promoteSubtaskToTask } = useTasks();
  const { currentOrganization, currentUserRole } = useAuth();
  const { toast } = useToast();

  const allStatuses = currentOrganization?.settings?.customization?.statuses || [];
  
  const showGamification = currentOrganization?.settings?.features?.gamification !== false;

  const isPrivilegedUser = useMemo(() => currentUser && (task.creatorId === currentUser.id || task.assigneeIds.includes(currentUser.id)), [currentUser, task.creatorId, task.assigneeIds]);
  const visibleSubtasks = useMemo(() => task.subtasks.filter(s => !s.isPrivate || isPrivilegedUser), [task.subtasks, isPrivilegedUser]);
  const hiddenSubtasksCount = task.subtasks.length - visibleSubtasks.length;

  const completedSubtasks = visibleSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = visibleSubtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const isSelected = selectedTaskIds.includes(task.id);
  const [liveTime, setLiveTime] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const isMuted = useMemo(() => {
    return currentUser?.mutedTaskIds?.includes(task.id);
  }, [currentUser?.mutedTaskIds, task.id]);

  const [dateStatus, setDateStatus] = useState({
    isOverdue: false,
    isDueToday: false,
    isDueSoon: false,
  });

  const blockedByTasks = useMemo(() => {
    return (task.blockedBy || [])
      .map(blockerId => allTasks.find(t => t.id === blockerId))
      .filter((t): t is Task => !!t);
  }, [task.blockedBy, allTasks]);

  const relatedTasks = useMemo(() => {
    return (task.relations || [])
      .map(relation => {
        const relatedTask = allTasks.find(t => t.id === relation.taskId);
        return relatedTask ? { ...relation, title: relatedTask.title } : null;
      })
      .filter(Boolean);
  }, [task.relations, allTasks]);


  const isBlocked = useMemo(() => {
    if (blockedByTasks.length === 0) return false;
    return blockedByTasks.some(blockerTask => {
        if (blockerTask.status !== 'Voltooid') return true;
        const dependencyConfig = task.dependencyConfig?.[blockerTask.id];
        if (dependencyConfig && blockerTask.completedAt) {
            const { lag, unit } = dependencyConfig;
            const addFn = unit === 'hours' ? addHours : addDays;
            const unlockDate = addFn(blockerTask.completedAt, lag);
            return isAfter(unlockDate, new Date());
        }
        return false;
    });
  }, [blockedByTasks, task.dependencyConfig]);

  const blockingTasks = useMemo(() => {
    return allTasks.filter(otherTask => otherTask.blockedBy?.includes(task.id));
  }, [allTasks, task.id]);


  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (task.activeTimerStartedAt) {
        const updateLiveTime = () => {
            const elapsed = Math.floor((new Date().getTime() - (task.activeTimerStartedAt as Date).getTime()) / 1000);
            setLiveTime(elapsed);
        };
        updateLiveTime();
        interval = setInterval(updateLiveTime, 1000);
    } else {
        setLiveTime(0);
    }
    return () => clearInterval(interval);
  }, [task.activeTimerStartedAt]);

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

  const canApprove = currentUser && task.creatorId && task.creatorId === currentUser.id && !task.assigneeIds.includes(currentUser.id);
  const canThank = showGamification && currentUser && task.status === 'Voltooid' && task.assigneeIds.length > 0 && !task.assigneeIds.includes(currentUser.id);
  const canRate = showGamification && currentUser && task.status === 'Voltooid' && task.creatorId === currentUser.id && !task.assigneeIds.includes(currentUser.id) && !task.rating;
  const canManageChoreOfWeek = currentUserRole === 'Owner' || currentUserRole === 'Admin';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(task.id);
    toast({
        title: "Taak ID Gekopieerd!",
        description: `ID ${task.id} is naar je klembord gekopieerd.`
    })
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="checkbox"]') || window.getSelection()?.toString()) {
      return;
    }
    if(target.closest('[data-state="open"], [data-state="closed"]')) {
        return;
    }
    setViewedTask(task);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setViewedTask(task);
    }
  }

  return (
    <div className="relative">
       <div className="absolute top-2 left-2 z-10">
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleTaskSelection(task.id)}
                aria-label={`Selecteer taak: ${task.title}`}
                className='bg-background/80 hover:bg-background'
            />
        </div>
      <Card 
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Open taakdetails voor: ${task.title}`}
        className={cn(
            'group-task-card hover:shadow-lg transition-shadow duration-200 bg-card border-l-4 overflow-hidden cursor-pointer', 
            statusInfo.color,
            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            isDragging && 'opacity-50',
            isBlocked && 'opacity-60 bg-red-500/10'
        )}
      >
        {task.imageDataUri && (
            <div className="relative aspect-[16/9] w-full">
                <Image
                  src={task.imageDataUri}
                  alt={task.title}
                  layout="fill"
                  objectFit="cover"
                />
            </div>
        )}
        <div className={cn(task.imageDataUri && "border-t")}>
            <CardHeader className="p-3 pb-2 pl-9">
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-sm font-semibold font-body leading-snug pt-1 flex items-center gap-1.5">
                {task.isChoreOfTheWeek && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400 shrink-0" />}
                {task.recurring && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
                {task.isSensitive && <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />}
                {task.helpNeeded && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HandHeart className="h-4 w-4 text-cyan-500 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hulp gezocht voor deze taak</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className="flex-1">
                    <Highlight text={task.title} highlight={searchTerm} />
                </span>
                </CardTitle>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label={`Meer acties voor taak ${task.title}`} onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setViewedTask(task)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details Bekijken
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/focus/${task.id}`}>
                        <Crosshair className="mr-2 h-4 w-4" />
                        Focus
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateTask(task.id, { helpNeeded: !task.helpNeeded })}>
                        <HandHeart className="mr-2 h-4 w-4" />
                        <span>{task.helpNeeded ? 'Hulp niet meer nodig' : 'Vraag om hulp'}</span>
                    </DropdownMenuItem>
                    {canManageChoreOfWeek && (
                      <DropdownMenuItem onClick={() => setChoreOfTheWeek(task.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          <span>{task.isChoreOfTheWeek ? 'Verwijder als Klus v/d Week' : 'Markeer als Klus v/d Week'}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => cloneTask(task.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Klonen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => splitTask(task.id)} disabled={task.subtasks.length < 2}>
                      <Divide className="mr-2 h-4 w-4" />
                      Splitsen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => resetSubtasks(task.id)} disabled={task.subtasks.length === 0}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Subtaken
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
                            {allStatuses.map(status => (
                                <DropdownMenuItem key={status} onClick={() => updateTask(task.id, { status })}>
                                    {status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleMuteTask(task.id)}>
                        {isMuted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                        <span>{isMuted ? 'Dempen opheffen' : 'Dempen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {task.status === 'Geannuleerd' ? (
                      <>
                        <DropdownMenuItem onClick={() => updateTask(task.id, { status: 'Te Doen' })}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Herstellen
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => deleteTaskPermanently(task.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Permanent verwijderen
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => updateTask(task.id, { status: 'Geannuleerd' })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Annuleren
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'Voltooid' }); }}
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Goedkeuren & Voltooien
                </Button>
            )}

            {canThank && (
                 <Button
                    size="sm"
                    variant="outline"
                    className="w-full mb-2"
                    onClick={(e) => { e.stopPropagation(); thankForTask(task.id); }}
                    disabled={task.thanked}
                >
                    <Heart className="mr-2 h-4 w-4 text-pink-500" />
                    {task.thanked ? 'Bedankt!' : `Bedank team`}
                </Button>
            )}

            {canRate && (
                <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Beoordeel deze taak:</p>
                    <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onMouseEnter={() => setHoverRating(star)} onClick={(e) => { e.stopPropagation(); rateTask(task.id, star); }} aria-label={`Geef ${star} sterren`}>
                                <Star className={cn('h-5 w-5', (hoverRating || 0) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showGamification && task.rating && (
                <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Beoordeling:</p>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={cn('h-5 w-5', task.rating! >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                        ))}
                    </div>
                </div>
            )}

            {task.attachments.length > 0 && (
                <div className="space-y-1 mt-2 pt-2 border-t">
                    {task.attachments.map((attachment) => (
                        <TooltipProvider key={attachment.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="flex items-center gap-2 text-sm text-foreground hover:bg-muted p-1 rounded-md"
                                    >
                                        <AttachmentIcon source={getAttachmentSource(attachment.url)} />
                                        <span className="truncate">{attachment.name}</span>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{attachment.url}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            )}

            {task.subtasks.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="subtasks" className="border-b-0">
                    <AccordionTrigger onClick={e => e.stopPropagation()} className="p-0 hover:no-underline [&_svg]:h-4 [&_svg]:w-4">
                    <div className="w-full space-y-1">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Subtaken</span>
                        <span>
                            {completedSubtasks}/{totalSubtasks}
                        </span>
                        </div>
                        {totalSubtasks > 0 && <Progress value={subtaskProgress} className="h-1" />}
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                    <div className="space-y-2">
                        {visibleSubtasks.map(subtask => (
                          <div key={subtask.id} className="flex items-center justify-between group" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`subtask-${subtask.id}`}
                                checked={subtask.completed}
                                onCheckedChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                              />
                              <label
                                htmlFor={`subtask-${subtask.id}`}
                                className={cn("text-sm leading-none cursor-pointer flex items-center gap-1.5", subtask.completed && "line-through text-muted-foreground")}
                              >
                                {subtask.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                                {subtask.text}
                              </label>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); promoteSubtaskToTask(task.id, subtask); }}
                                    title="Promoveer naar taak"
                                    aria-label="Promoveer subtaak naar taak"
                                >
                                    <CornerUpRight className="h-4 w-4" />
                                </Button>
                                {subtask.completed && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSubtaskCompletion(task.id, subtask.id);
                                        }}
                                        title="Reset subtaak"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                          </div>
                        ))}
                         {hiddenSubtasksCount > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                <EyeOff className="h-3 w-3" />
                                {hiddenSubtasksCount} privé subtaak verborgen
                            </div>
                         )}
                    </div>
                    </AccordionContent>
                </AccordionItem>
                </Accordion>
            )}
            </CardContent>
            <TaskCardFooter
                task={task}
                users={users}
                projects={projects}
                isBlocked={isBlocked}
                isOverdue={isOverdue}
                isDueToday={isDueToday}
                isDueSoon={isDueSoon}
                liveTime={liveTime}
                blockedByTasks={blockedByTasks}
                blockingTasks={blockingTasks}
                relatedTasks={relatedTasks}
            />
        </div>
      </Card>
    </div>
  );
};

export default TaskCard;
