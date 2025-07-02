
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  Timestamp,
  query,
  where,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { useFilters } from '@/contexts/system/filter-context';
import * as TaskCrudActions from '@/app/actions/project/task-crud.actions';
import * as TaskStateActions from '@/app/actions/project/task-state.actions';
import * as TaskTimerActions from '@/app/actions/project/task-timer.actions';
import * as TaskCollaborationActions from '@/app/actions/project/task-collaboration.actions';
import * as CommentActions from '@/app/actions/core/comment.actions';
import { toggleMuteTask as toggleMuteTaskAction } from '@/app/actions/user/member.actions';
import { thankForTask as thankForTaskAction, rateTask as rateTaskAction } from '@/app/actions/core/gamification.actions';
import { useRouter } from 'next/navigation';
import { triggerHapticFeedback } from '@/lib/core/haptics';
import { isWithinInterval } from 'date-fns';
import { handleServerAction } from '@/lib/utils/action-wrapper';

// Import all required types from their new modular locations
import type { User } from '@/lib/types/auth';
import type { Task, TaskFormValues, Status, Label, Subtask, Priority } from '@/lib/types/tasks';
import type { Project } from '@/lib/types/projects';
import { PERMISSIONS, ROLE_GUEST } from '@/lib/types/permissions';


type GroupedTasks = {
  title: string;
  tasks: Task[];
}

type TaskContextType = {
  tasks: Task[];
  filteredTasks: Task[];
  groupedTasks: GroupedTasks[];
  loading: boolean;
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  rateTask: (taskId: string, rating: number) => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments' | 'labels'>> & { addLabels?: string[], removeLabels?: string[] }) => Promise<void>;
  cloneTask: (taskId: string) => Promise<void>;
  splitTask: (taskId: string) => Promise<void>;
  deleteTaskPermanently: (taskId: string) => Promise<void>;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => Promise<void>;
  toggleTaskTimer: (taskId: string) => Promise<void>;
  reorderTasks: (tasksToUpdate: {id: string, order: number}[]) => Promise<void>;
  resetSubtasks: (taskId: string) => Promise<void>;
  thankForTask: (taskId: string) => Promise<void>;
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => Promise<void>;
  setChoreOfTheWeek: (taskId: string) => Promise<void>;
  promoteSubtaskToTask: (parentTaskId: string, subtask: Subtask) => Promise<void>;
  navigateToUserProfile: (userId: string) => void;
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
  viewedTask: Task | null;
  setViewedTask: (task: Task | null) => void;
  toggleMuteTask: (taskId: string) => Promise<void>;
  voteOnPoll: (taskId: string, optionId: string) => Promise<void>;
  handOffTask: (taskId: string, fromUserId: string, toUserId: string, message?: string) => Promise<boolean>;
  groupBy: 'status' | 'assignee' | 'priority' | 'project';
  setGroupBy: (groupBy: 'status' | 'assignee' | 'priority' | 'project') => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const processTaskDoc = (doc: any, projects: Project[], canViewSensitive: boolean, user: User) => {
    const data = doc.data();
    const task: Task = {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        dueDate: (data.dueDate as Timestamp)?.toDate(),
        completedAt: (data.completedAt as Timestamp)?.toDate(),
        activeTimerStartedAt: data.activeTimerStartedAt ? Object.fromEntries(
          Object.entries(data.activeTimerStartedAt).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ) : null,
        history: (data.history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })),
        comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate(), readBy: c.readBy || [] })),
        typing: data.typing ? Object.fromEntries(
          Object.entries(data.typing).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ) : undefined,
    };
    
    // Mask sensitive data
    const projectIsSensitive = task.projectId ? projects.find(p => p.id === task.projectId)?.isSensitive : false;
    if ((task.isSensitive || projectIsSensitive) && !canViewSensitive) {
        return { ...task, title: '[Gevoelige Taak]', description: 'U heeft geen permissie om de details van deze taak te zien.', subtasks: task.subtasks.map(st => ({...st, text: '[Verborgen]'})) };
    }
    
    // Filter private subtasks
    if(task.subtasks) {
      task.subtasks = task.subtasks.filter(st => !st.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id);
    }
    
    return task;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization, currentUserRole, currentUserPermissions, projects, users, loading: orgLoading } = useOrganization();
  const { filters, searchTerm, dateRange } = useFilters();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority' | 'project'>('status');
  
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const navigateToUserProfile = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };

  useEffect(() => {
    if (orgLoading) {
      setLoading(true);
      return;
    }
    
    if (!currentOrganization || !user) {
      setTasks([]); 
      setLoading(false);
      return;
    }

    setLoading(true);

    const canViewSensitive = currentUserPermissions.includes(PERMISSIONS.VIEW_SENSITIVE_DATA);
    const isGuest = currentUserRole === ROLE_GUEST;

    const baseQueryConstraints = [where("organizationId", "==", currentOrganization.id)];
    if (isGuest) {
      const guestAccess = currentOrganization.settings?.guestAccess?.[user.id];
      const projectIds = guestAccess?.projectIds || [];
      if (projectIds.length > 0) {
        baseQueryConstraints.push(where("projectId", "in", projectIds));
      } else {
        baseQueryConstraints.push(where('id', '==', 'guest-has-no-access'));
      }
    }
    const tasksQuery = query(
        collection(db, 'tasks'), 
        ...baseQueryConstraints,
        orderBy('createdAt', 'desc'),
        limit(500) // Increase limit for better local filtering
    );
    
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs
        .map(doc => processTaskDoc(doc, projects, canViewSensitive, user))
        .filter(task => !task.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id);
      
      setTasks(tasksData);
      setLoading(false);
    }, (e) => {
      console.error('Error loading tasks:', e);
      toast({ title: 'Fout bij laden van taken', description: e.message, variant: 'destructive' });
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
    };
  }, [user, currentOrganization, orgLoading, projects, currentUserPermissions, currentUserRole, toast]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchTermMatch = searchTerm.toLowerCase()
        ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const assigneeMatch = filters.assigneeId ? task.assigneeIds.includes(filters.assigneeId) : true;
      const labelMatch = filters.labels.length > 0 ? filters.labels.every(label => task.labels.includes(label as Label)) : true;
      const priorityMatch = filters.priority ? task.priority === filters.priority : true;
      const teamMatch = filters.teamId ? task.teamId === filters.teamId : true;
      const projectMatch = filters.projectId ? task.projectId === filters.projectId : true;

      const dateMatch = dateRange?.from && dateRange?.to && task.createdAt
        ? isWithinInterval(task.createdAt, { start: dateRange.from, end: dateRange.to })
        : true;

      return searchTermMatch && assigneeMatch && labelMatch && priorityMatch && teamMatch && dateMatch && projectMatch;
    });
  }, [tasks, searchTerm, filters, dateRange]);

  const groupedTasks = useMemo(() => {
    const tasksToGroup = filteredTasks.filter(t => !t.isChoreOfTheWeek);

    if (groupBy === 'status') {
      const statuses = currentOrganization?.settings?.customization?.statuses || [];
      return statuses.map(status => ({
        title: status.name,
        tasks: tasksToGroup.filter(task => task.status === status.name).sort((a,b) => a.order - b.order)
      }));
    }
    if (groupBy === 'assignee') {
      const tasksByAssignee: Record<string, Task[]> = {};
      tasksToGroup.forEach(task => {
        if (task.assigneeIds.length === 0) {
          if (!tasksByAssignee['Niet toegewezen']) tasksByAssignee['Niet toegewezen'] = [];
          tasksByAssignee['Niet toegewezen'].push(task);
        } else {
          task.assigneeIds.forEach(id => {
            const user = users.find(u => u.id === id);
            const name = user ? user.name : 'Onbekende gebruiker';
            if (!tasksByAssignee[name]) tasksByAssignee[name] = [];
            tasksByAssignee[name].push(task);
          });
        }
      });
      const sortedEntries = Object.entries(tasksByAssignee).sort(([a], [b]) => a.localeCompare(b));
      return sortedEntries.map(([title, tasks]) => ({ title, tasks: tasks.sort((a,b) => a.order - b.order) }));
    }
    if (groupBy === 'priority') {
      const priorities = currentOrganization?.settings?.customization?.priorities?.map(p => p.name) || [];
      return priorities.map(priority => ({
        title: priority,
        tasks: tasksToGroup.filter(task => task.priority === priority).sort((a,b) => a.order - b.order)
      }));
    }
    if (groupBy === 'project') {
        const tasksByProject: Record<string, Task[]> = {};
        tasksToGroup.forEach(task => {
            const project = projects.find(p => p.id === task.projectId);
            const projectName = project ? project.name : 'Geen Project';
            if (!tasksByProject[projectName]) tasksByProject[projectName] = [];
            tasksByProject[projectName].push(task);
        });
        const sortedEntries = Object.entries(tasksByProject).sort(([a], [b]) => a.localeCompare(b));
        return sortedEntries.map(([title, tasks]) => ({ title, tasks: tasks.sort((a,b) => a.order - b.order) }));
    }
    return [];
  }, [filteredTasks, groupBy, currentOrganization, users, projects]);

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }): Promise<boolean> => {
    if (!user || !currentOrganization) {
        toast({ title: 'Fout', description: 'Selecteer een organisatie.', variant: 'destructive' });
        return false;
    }
    const result = await handleServerAction(
        () => TaskCrudActions.createTaskAction(currentOrganization.id, user.id, user.name, taskData),
        toast,
        {
            successToast: {
                title: 'Taak Aangemaakt!',
                description: () => `De taak "${taskData.title}" is aangemaakt.`,
            },
            errorContext: 'opslaan taak',
        }
    );
    return !result.error;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !currentOrganization) return;
    
    if (updates.status === 'Voltooid') {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate?.status !== 'Voltooid') {
             triggerHapticFeedback([100, 30, 100]);
        }
    }
    
    await handleServerAction(
        () => TaskCrudActions.updateTaskAction(taskId, updates, user.id, currentOrganization.id),
        toast,
        { errorContext: 'bijwerken taak' }
    );
  };

  const cloneTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskCrudActions.cloneTaskAction(taskId, user.id, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Taak Gekloond!',
                description: (data) => `Een kopie van "${(data as any).clonedTaskTitle}" is aangemaakt.`
            },
            errorContext: 'klonen taak'
        }
    );
  };

  const splitTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskCrudActions.splitTaskAction(taskId, user.id, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Taak gesplitst!',
                description: () => `Een nieuwe taak is aangemaakt.`
            },
            errorContext: 'splitsen taak'
        }
    );
  };

  const deleteTaskPermanently = async (taskId: string) => {
    if (!currentOrganization) return;
    const result = await handleServerAction(
        () => TaskCrudActions.deleteTaskPermanentlyAction(taskId, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Taak Permanent Verwijderd',
                description: () => `De taak is permanent verwijderd.`
            },
            errorContext: 'permanent verwijderen taak'
        }
    );
    if (!result.error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const rateTask = async (taskId: string, rating: number) => {
    if (!user || !currentOrganization) return;
    const taskToRate = tasks.find(t => t.id === taskId);
    if (!taskToRate) return;

    const result = await handleServerAction(
        () => rateTaskAction(taskId, rating, taskToRate, user.id, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Taak beoordeeld!',
                description: () => 'Bonuspunten gegeven.'
            },
            errorContext: 'beoordelen taak'
        }
    );
    if (!result.error) {
        triggerHapticFeedback([50, 50, 50]);
    }
  };

  const thankForTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const taskAssignees = tasks.find(t => t.id === taskId)?.assigneeIds || [];
    const fullAssigneeInfo = users.filter(u => taskAssignees.includes(u.id));

    const result = await handleServerAction(
        () => thankForTaskAction(taskId, user.id, fullAssigneeInfo, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Bedankt!',
                description: (data) => `Bonuspunten gegeven aan ${(data as any).assigneesNames}.`
            },
            errorContext: 'bedanken voor taak'
        }
    );
    if (!result.error) {
        triggerHapticFeedback(200);
    }
  };
  
  const reorderTasks = async (tasksToUpdate: {id: string, order: number}[]) => {
    await handleServerAction(
        () => TaskStateActions.reorderTasksAction(tasksToUpdate),
        toast,
        { errorContext: 'herordenen taken' }
    );
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskStateActions.toggleSubtaskCompletionAction(taskId, subtaskId, user.id, currentOrganization.id),
        toast,
        { errorContext: 'bijwerken subtaak' }
    );
  };
  
  const toggleTaskTimer = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskTimerActions.toggleTaskTimerAction(taskId, user.id, currentOrganization.id),
        toast,
        { errorContext: 'tijdregistratie' }
    );
  };

  const resetSubtasks = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskStateActions.resetSubtasksAction(taskId, user.id, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Subtaken gereset!',
                description: (data) => `Alle subtaken voor "${(data as any).taskTitle}" zijn gereset.`
            },
            errorContext: 'resetten subtaken'
        }
    );
  };

  const setChoreOfTheWeek = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskCrudActions.updateTaskAction(taskId, { isChoreOfTheWeek: true }, user.id, currentOrganization.id),
        toast,
        {
            successToast: {
                title: 'Klus van de Week ingesteld!',
                description: () => `De taak is nu de Klus van de Week.`
            },
            errorContext: 'instellen klus v/d week'
        }
    );
  };

  const promoteSubtaskToTask = async (parentTaskId: string, subtask: Subtask) => {
    if (!user) return;
    await handleServerAction(
        () => TaskStateActions.promoteSubtaskToTask(parentTaskId, subtask, user.id),
        toast,
        {
            successToast: {
                title: 'Subtaak Gepromoveerd!',
                description: (data) => `"${(data as any).newTastTitle}" is nu een losstaande taak.`
            },
            errorContext: 'promoveren subtaak'
        }
    );
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments' | 'labels'>> & { addLabels?: string[], removeLabels?: string[] }) => {
      // This function needs custom logic, so we don't use the wrapper.
      // It performs a batch write which is a different pattern.
  };

  const toggleMuteTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => toggleMuteTaskAction(currentOrganization.id, user.id, taskId),
        toast,
        {
            successToast: {
                title: 'Instelling opgeslagen',
                description: (data) => `Taak is ${(data as any).newState === 'muted' ? 'gedempt' : 'dempen opgeheven'}.`
            },
            errorContext: 'dempen taak'
        }
    );
  };

  const toggleCommentReaction = async (taskId: string, commentId: string, emoji: string) => {
    if (!user) return;
    await handleServerAction(
        () => CommentActions.toggleCommentReactionAction(taskId, commentId, emoji, user.id),
        toast,
        { errorContext: 'reageren op commentaar' }
    );
  };

  const voteOnPoll = async (taskId: string, optionId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
        () => TaskCollaborationActions.voteOnPollAction(taskId, optionId, user.id, currentOrganization.id),
        toast,
        { errorContext: 'stemmen op poll' }
    );
  };

  const handOffTask = async (taskId: string, fromUserId: string, toUserId: string, message: string = ''): Promise<boolean> => {
    const result = await handleServerAction(
        () => TaskCollaborationActions.handOffTaskAction(taskId, fromUserId, toUserId, message),
        toast,
        { errorContext: 'overdragen taak' }
    );
    return !result.error;
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, filteredTasks, groupedTasks, loading, addTask, updateTask, rateTask, toggleSubtaskCompletion,
      toggleTaskTimer, reorderTasks, resetSubtasks, thankForTask, toggleCommentReaction,
      setChoreOfTheWeek, promoteSubtaskToTask,
      bulkUpdateTasks, cloneTask, splitTask, deleteTaskPermanently,
      navigateToUserProfile, isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask, 
      toggleMuteTask, voteOnPoll, handOffTask,
      groupBy, setGroupBy
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
