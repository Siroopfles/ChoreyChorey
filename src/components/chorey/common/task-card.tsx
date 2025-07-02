
'use client';
import { PERMISSIONS, type Task, type User, type Project, type Subtask, type Comment, type StatusDefinition, type Label } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
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
  CornerUpRight,
  Pin,
  Timer,
  ArrowRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { getAttachmentSource } from '@/lib/utils/attachment-utils';
import { AttachmentIcon } from './attachment-icons';
import { FigmaEmbed } from '../integrations/figma-embed';
import { GoogleDocEmbed } from '../integrations/google-doc-embed';
import { AdobeXdEmbed } from '../integrations/adobe-xd-embed';
import { TaskCardFooter } from './task-card-footer';
import { useFilters } from '@/contexts/system/filter-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { HandoffTaskDialog } from '../dialogs/handoff-task-dialog';
import { useView } from '@/contexts/system/view-context';
import { handleServerAction } from '@/lib/utils/action-wrapper';
import * as TaskCrudActions from '@/app/actions/project/task-crud.actions';
import * as TaskStateActions from '@/app/actions/project/task-state.actions';
import * as TaskTimerActions from '@/app/actions/project/task-timer.actions';
import { toggleMuteTask as toggleMuteTaskAction } from '@/app/actions/user/member.actions';
import { thankForTask as thankForTaskAction, rateTask as rateTaskAction } from '@/app/actions/core/gamification.actions';
import { triggerHapticFeedback } from '@/lib/core/haptics';
import * as ProjectActions from '@/app/actions/project/project.actions';

type TaskCardProps = {
  task: Task;
  users: User[];
  isDragging?: boolean;
  currentUser: User | null;
  projects: Project[];
  isBlocked: boolean;
  blockingTasks: Task[];
  relatedTasks: { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[];
  blockedByTasks: Task[];
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
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


const TaskCard = ({ task, users, isDragging, currentUser, projects, isBlocked, isOverdue, isDueToday, isDueSoon, blockingTasks, relatedTasks, blockedByTasks }: TaskCardProps) => {
  const { toast } = useToast();
  const { selectedTaskIds, toggleTaskSelection } = useFilters();
  const { currentOrganization, currentUserRole, currentUserPermissions } = useOrganization();
  const { setViewedTask } = useView();
  
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
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);

  const statusConfig = useMemo(() => 
    currentOrganization?.settings?.customization?.statuses?.find(s => s.name === task.status),
    [currentOrganization, task.status]
  );
  const borderColorStyle = statusConfig ? { borderLeftColor: `hsl(${statusConfig.color})` } : {};


  const isMuted = useMemo(() => {
    return currentUser?.mutedTaskIds?.includes(task.id);
  }, [currentUser?.mutedTaskIds, task.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    const activeTimers = task.activeTimerStartedAt;

    if (activeTimers && Object.keys(activeTimers).length > 0) {
        const updateLiveTime = () => {
            const now = new Date().getTime();
            const totalElapsed = Object.values(activeTimers).reduce((sum, startTime) => {
                const elapsed = Math.floor((now - (startTime as Date).getTime()) / 1000);
                return sum + elapsed;
            }, 0);
            setLiveTime(totalElapsed);
        };
        updateLiveTime();
        interval = setInterval(updateLiveTime, 1000);
    } else {
        setLiveTime(0);
    }

    return () => clearInterval(interval);
  }, [task.activeTimerStartedAt]);

  const canApprove = currentUser && task.creatorId && task.creatorId === currentUser.id && !task.assigneeIds.includes(currentUser.id);
  const canThank = showGamification && currentUser && task.status === 'Voltooid' && task.assigneeIds.length > 0 && !task.assigneeIds.includes(currentUser.id);
  const canRate = showGamification && currentUser && task.status === 'Voltooid' && task.creatorId === currentUser.id && !task.assigneeIds.includes(currentUser.id) && !task.rating;
  const canManageChoreOfWeek = currentUserRole === 'Owner' || currentUserRole === 'Admin';
  const canPin = currentUserPermissions.includes(PERMISSIONS.PIN_ITEMS);
  const canHandOff = currentUser && task.assigneeIds.includes(currentUser.id);
  const showTimeTracking = currentOrganization?.settings?.features?.timeTracking !== false;

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

  const updateTask = async (updates: Partial<Task>) => {
    if (!currentUser || !currentOrganization) return;
    
    if (updates.status === 'Voltooid' && task.status !== 'Voltooid') {
        triggerHapticFeedback([100, 30, 100]);
    }
    
    await handleServerAction(
        () => TaskCrudActions.updateTaskAction(task.id, updates, currentUser.id, currentOrganization.id),
        toast,
        { errorContext: 'bijwerken taak' }
    );
  };
  
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
        style={borderColorStyle}
        className={cn(
            'group-task-card hover:shadow-lg transition-shadow duration-200 bg-card border-l-4 overflow-hidden cursor-pointer', 
            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            isDragging && 'opacity-50',
            isBlocked && 'opacity-60 bg-red-500/10'
        )}
      >
        {task.imageUrl && (
            <div className="relative aspect-[16/9] w-full">
                <Image
                  src={task.imageUrl}
                  alt={task.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
            </div>
        )}
        <div className={cn(task.imageUrl && "border-t")}>
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
                    <DropdownMenuItem onClick={() => handleServerAction(() => TaskTimerActions.toggleTaskTimerAction(task.id, currentUser!.id, currentOrganization!.id), toast, { errorContext: 'tijdregistratie' })} disabled={!showTimeTracking}>
                        {currentUser && task.activeTimerStartedAt?.[currentUser.id] ? <TimerOff className="mr-2 h-4 w-4" /> : <Timer className="mr-2 h-4 w-4" />}
                        <span>{currentUser && task.activeTimerStartedAt?.[currentUser.id] ? 'Stop mijn timer' : 'Start mijn timer'}</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setIsHandoffOpen(true)} disabled={!canHandOff}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        <span>Taak Overdragen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateTask({ helpNeeded: !task.helpNeeded })}>
                        <HandHeart className="mr-2 h-4 w-4" />
                        <span>{task.helpNeeded ? 'Hulp niet meer nodig' : 'Vraag om hulp'}</span>
                    </DropdownMenuItem>
                    {canManageChoreOfWeek && (
                      <DropdownMenuItem onClick={() => handleServerAction(() => TaskCrudActions.updateTaskAction(task.id, { isChoreOfTheWeek: true }, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: 'Klus van de Week ingesteld!', description: () => `De taak is nu de Klus van de Week.`}, errorContext: 'instellen klus v/d week'})}>
                          <Star className="mr-2 h-4 w-4" />
                          <span>{task.isChoreOfTheWeek ? 'Verwijder als Klus v/d Week' : 'Markeer als Klus v/d Week'}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleServerAction(() => TaskCrudActions.cloneTaskAction(task.id, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: 'Taak Gekloond!', description: (data) => `Een kopie van "${(data as any).clonedTaskTitle}" is aangemaakt.`}, errorContext: 'klonen taak'})}>
                    <Copy className="mr-2 h-4 w-4" />
                    Klonen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleServerAction(() => TaskCrudActions.splitTaskAction(task.id, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: 'Taak gesplitst!', description: () => `Een nieuwe taak is aangemaakt.`}, errorContext: 'splitsen taak'})} disabled={task.subtasks.length < 2}>
                      <Divide className="mr-2 h-4 w-4" />
                      Splitsen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleServerAction(() => TaskStateActions.resetSubtasksAction(task.id, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: 'Subtaken gereset!', description: (data) => `Alle subtaken voor "${(data as any).taskTitle}" zijn gereset.`}, errorContext: 'resetten subtaken'})} disabled={task.subtasks.length === 0}>
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
                                <DropdownMenuItem key={status.name} onClick={() => updateTask({ status: status.name })}>
                                    {status.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => handleServerAction(() => ProjectActions.toggleProjectPin(task.id, !task.pinned, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: `Project ${!task.pinned ? 'vastgepind' : 'losgemaakt'}.`}, errorContext: 'vastpinnen taak'})} disabled={!canPin}>
                        <Pin className={cn("mr-2 h-4 w-4", task.pinned && "fill-current")} />
                        <span>{task.pinned ? 'Taak losmaken' : 'Taak vastpinnen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleServerAction(() => toggleMuteTaskAction(currentOrganization!.id, currentUser!.id, task.id), toast, { successToast: { title: 'Instelling opgeslagen', description: (data) => `Taak is ${(data as any).newState === 'muted' ? 'gedempt' : 'dempen opgeheven'}.`}, errorContext: 'dempen taak'})}>
                        {isMuted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                        <span>{isMuted ? 'Dempen opheffen' : 'Dempen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {task.status === 'Geannuleerd' ? (
                      <>
                        <DropdownMenuItem onClick={() => updateTask({ status: 'Te Doen' })}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Herstellen
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleServerAction(() => TaskCrudActions.deleteTaskPermanentlyAction(task.id, currentOrganization!.id), toast, { successToast: { title: 'Taak Permanent Verwijderd', description: () => `De taak is permanent verwijderd.`}, errorContext: 'permanent verwijderen taak'})}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Permanent verwijderen
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => updateTask({ status: 'Geannuleerd' })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Verplaats naar Prullenbak
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            </CardHeader>
            <CardContent className="p-3 pt-1 pl-9">
            <div className="flex flex-wrap gap-1 mb-2">
                {(task.labels || []).map((label) => (
                <Badge key={label} variant="secondary" className="font-normal text-xs">
                    {label}
                </Badge>
                ))}
            </div>
            
            {task.status === 'In Review' && canApprove && (
                <Button
                    size="sm"
                    className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={(e) => { e.stopPropagation(); updateTask({ status: 'Voltooid' }); }}
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
                    onClick={(e) => { e.stopPropagation(); handleServerAction(() => thankForTaskAction(task.id, currentUser!.id, users.filter(u => task.assigneeIds.includes(u.id)), currentOrganization!.id), toast, { successToast: { title: 'Bedankt!', description: (data) => `Bonuspunten gegeven aan ${(data as any).assigneesNames}.`}, errorContext: 'bedanken voor taak'}) }}
                    disabled={task.thanked}
                    data-cy="thank-button"
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
                            <button key={star} onMouseEnter={() => setHoverRating(star)} onClick={(e) => { e.stopPropagation(); handleServerAction(() => rateTaskAction(task.id, star, task, currentUser!.id, currentOrganization!.id), toast, { successToast: { title: 'Taak beoordeeld!', description: () => 'Bonuspunten gegeven.'}, errorContext: 'beoordelen taak'}) }} aria-label={`Geef ${star} sterren`} data-cy={`rate-star-${star}`}>
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
                    {task.attachments.map((attachment) => {
                        const source = getAttachmentSource(attachment.url);
                        const isEmbeddable = source.startsWith('google-') || source === 'figma' || source === 'adobe-xd';
                        const urlValue = attachment.url;
                        return (
                            <div key={attachment.id} className="space-y-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-2 text-sm text-foreground hover:bg-muted p-1 rounded-md"
                                            >
                                                <AttachmentIcon source={source} />
                                                <span className="truncate">{attachment.name}</span>
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{attachment.url}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {isEmbeddable && urlValue && source === 'figma' && <FigmaEmbed url={urlValue} />}
                                {isEmbeddable && urlValue && source.startsWith('google-') && <GoogleDocEmbed url={urlValue} />}
                                {isEmbeddable && urlValue && source === 'adobe-xd' && <AdobeXdEmbed url={urlValue} />}
                            </div>
                        )
                    })}
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
                                onCheckedChange={() => handleServerAction(() => TaskStateActions.toggleSubtaskCompletionAction(task.id, subtask.id, currentUser!.id, currentOrganization!.id), toast, { errorContext: 'bijwerken subtaak' })}
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
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); handleServerAction(() => TaskStateActions.promoteSubtaskToTask(task.id, subtask, currentUser!.id), toast, { successToast: { title: 'Subtaak Gepromoveerd!', description: (data) => `"${(data as any).newTastTitle}" is nu een losstaande taak.`}, errorContext: 'promoveren subtaak'}) }}
                                    title="Promoveer naar taak"
                                    aria-label="Promoveer subtaak naar nieuwe taak"
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
                                            handleServerAction(() => TaskStateActions.toggleSubtaskCompletionAction(task.id, subtask.id, currentUser!.id, currentOrganization!.id), toast, { errorContext: 'bijwerken subtaak' });
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
                blockedByTasks={blockingTasks}
                relatedTasks={relatedTasks}
                blockedByTasks={blockedByTasks}
            />
        </div>
      </Card>
       {currentUser && (
          <HandoffTaskDialog
            open={isHandoffOpen}
            onOpenChange={setIsHandoffOpen}
            task={task}
            currentUser={currentUser}
          />
        )}
    </div>
  );
};

export default TaskCard;

    
