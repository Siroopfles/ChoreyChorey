

'use client';

import type { Task, User, Project } from '@/lib/types';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    Flame,
    ChevronUp,
    Equal,
    ChevronDown,
    User as UserIcon,
    Lock,
    Hourglass,
    CheckCircle2,
    Archive,
    XCircle,
    MessageSquare,
    Trophy,
    Clock,
    Link as LinkIcon,
    Database,
    Timer,
    Briefcase,
    GitBranch,
    Github,
    Volume2,
    Loader2
} from 'lucide-react';
import { calculatePoints } from '@/lib/utils';
import { GitLabIcon, JiraIcon, BitbucketIcon } from './provider-icons';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const priorityConfig = {
    Urgent: { icon: Flame, color: 'text-chart-1' },
    Hoog: { icon: ChevronUp, color: 'text-chart-2' },
    Midden: { icon: Equal, color: 'text-chart-3' },
    Laag: { icon: ChevronDown, color: 'text-chart-4' },
};

const statusConfig: Record<string, { icon?: JSX.Element }> = {
    'In Review': { icon: <Hourglass className="h-5 w-5 text-[hsl(var(--status-in-review))]" /> },
    'Voltooid': { icon: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-completed))]" /> },
    'Gearchiveerd': { icon: <Archive className="h-5 w-5 text-gray-500" /> },
    'Geannuleerd': { icon: <XCircle className="h-5 w-5 text-destructive" /> },
};


type TaskCardFooterProps = {
    task: Task;
    users: User[];
    projects: Project[];
    isBlocked: boolean;
    isOverdue: boolean;
    isDueToday: boolean;
    isDueSoon: boolean;
    liveTime: number;
    blockedByTasks: Task[];
    blockingTasks: Task[];
    relatedTasks: { taskId: string; type: "related_to" | "duplicate_of"; title?: string }[];
};

export function TaskCardFooter({
    task,
    users,
    projects,
    isBlocked,
    isOverdue,
    isDueToday,
    isDueSoon,
    liveTime,
    blockedByTasks,
    blockingTasks,
    relatedTasks,
}: TaskCardFooterProps) {
    const { navigateToUserProfile } = useTasks();
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const assignees = useMemo(() => task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[], [task.assigneeIds, users]);
    const project = projects.find((p) => p.id === task.projectId);
    const PriorityIcon = priorityConfig[task.priority]?.icon || Equal;
    const statusInfo = statusConfig[task.status] || {};

    const showGamification = currentOrganization?.settings?.features?.gamification !== false;
    const showStoryPoints = currentOrganization?.settings?.features?.storyPoints !== false;
    const showTimeTracking = currentOrganization?.settings?.features?.timeTracking !== false;
    const totalTimeLogged = (task.timeLogged || 0) + liveTime;
    const points = showGamification ? calculatePoints(task.priority, task.storyPoints) : 0;
    
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}u ${remainingMinutes}m`;
    };

    const onTextToSpeech = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsSynthesizing(true);
        try {
          const result = await textToSpeech(task.title);
          if (result.audioDataUri) {
            const audio = new Audio(result.audioDataUri);
            audio.play().catch(err => console.error("Audio play failed:", err)); // Add error handling for play()
            audio.onended = () => setIsSynthesizing(false);
          } else {
            throw new Error('Geen audio data ontvangen');
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
        <div className="p-3 pt-2 flex justify-between items-center text-xs text-muted-foreground pl-9">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full items-center">
                {/* Assignees */}
                <div className="flex items-center -space-x-2">
                    {assignees.length > 0 ? (
                        assignees.slice(0, 3).map(assignee => (
                            <TooltipProvider key={assignee.id}>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                    type="button"
                                    className="rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={(e) => { e.stopPropagation(); navigateToUserProfile(assignee.id); }}
                                    aria-label={`Bekijk profiel van ${assignee.name}`}
                                    >
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{assignee.name}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))
                    ) : (
                        <div className="h-6 w-6 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                        </div>
                    )}
                    {assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                        +{assignees.length - 3}
                        </div>
                    )}
                </div>
                
                {/* Project */}
                {project && (
                    <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate">{project.name}</span>
                    </div>
                )}
                
                {/* Due Date */}
                {task.dueDate && (
                    <div className={cn('flex items-center gap-1', { 'text-destructive': isOverdue, 'text-orange-500 font-semibold': isDueToday, 'text-yellow-600': isDueSoon })}>
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(task.dueDate, 'd MMM')}</span>
                    </div>
                )}

                {/* Priority */}
                <div className={cn('flex items-center gap-1 font-medium', priorityConfig[task.priority]?.color || 'text-muted-foreground')}>
                    <PriorityIcon className="h-3 w-3" />
                    <span>{task.priority}</span>
                </div>
                
                {/* Blockers & Relations */}
                {isBlocked && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-destructive font-semibold">
                                    <LinkIcon className="h-3 w-3" />
                                    <span>Geblokkeerd</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="p-1">
                                    <p className="font-semibold mb-1">Geblokkeerd door:</p>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {blockedByTasks.map(blockerTask => (
                                            <li key={blockerTask.id} className={cn(blockerTask.status === 'Voltooid' && 'text-muted-foreground')}>
                                                {blockerTask.title} ({blockerTask.status})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {blockingTasks.length > 0 && (
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-blue-500 font-semibold">
                                <GitBranch className="h-3 w-3" />
                                <span>Blokkeert {blockingTasks.length}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold mb-1">Blokkeert de volgende taken:</p>
                            <ul className="list-disc list-inside text-xs space-y-1">
                            {blockingTasks.map(t => <li key={t.id}>{t.title}</li>)}
                            </ul>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {relatedTasks && relatedTasks.length > 0 && (
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-gray-500 font-semibold">
                                <GitBranch className="h-3 w-3 rotate-90" />
                                <span>{relatedTasks.length}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold mb-1">Gerelateerde Taken:</p>
                            <ul className="list-disc list-inside text-xs space-y-1">
                            {relatedTasks.map(relation => <li key={relation.taskId}>{relation.title} ({relation.type === 'duplicate_of' ? 'duplicaat' : 'gerelateerd'})</li>)}
                            </ul>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                
                {/* Time & Points */}
                {showTimeTracking && (totalTimeLogged > 0 || task.activeTimerStartedAt) && (
                    <div className={cn("flex items-center gap-1", task.activeTimerStartedAt && "text-primary animate-pulse font-semibold")}>
                        <Timer className="h-3 w-3" />
                        <span>{formatTime(totalTimeLogged)}</span>
                    </div>
                )}
                {showGamification && (
                    <div className="flex items-center gap-1 font-medium text-amber-600">
                        <Trophy className="h-3 w-3" />
                        <span>{points}</span>
                    </div>
                )}
                
                {/* Counts & Icons */}
                {task.comments?.length > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{task.comments.length}</span>
                    </div>
                )}
                {task.githubLinks?.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Github className="h-3 w-3" />
                        <span>{task.githubLinks.length}</span>
                    </div>
                )}
                 {task.gitlabLinks?.length > 0 && (
                    <div className="flex items-center gap-1">
                        <GitLabIcon className="h-3 w-3" />
                        <span>{task.gitlabLinks.length}</span>
                    </div>
                )}
                 {task.bitbucketLinks?.length > 0 && (
                    <div className="flex items-center gap-1">
                        <BitbucketIcon className="h-3 w-3" />
                        <span>{task.bitbucketLinks.length}</span>
                    </div>
                )}
                 {task.jiraLinks?.length > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3"><JiraIcon className="text-[#0052CC]" /></div>
                        <span>{task.jiraLinks.length}</span>
                    </div>
                )}
                
                {/* Creation Date & Status */}
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(task.createdAt, { locale: nl, addSuffix: true })}</span>
                </div>
                {showStoryPoints && task.storyPoints !== null && task.storyPoints !== undefined && (
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
            
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 ml-1" onClick={onTextToSpeech} disabled={isSynthesizing} aria-label={`Lees taaktitel voor: ${task.title}`}>
            {isSynthesizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
            </Button>
        </div>
    );
}
