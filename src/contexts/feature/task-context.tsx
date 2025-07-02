
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  Timestamp, 
  writeBatch, 
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  getDocs,
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
import { ToastAction } from '@/components/ui/toast';
import { triggerHapticFeedback } from '@/lib/core/haptics';
import { isWithinInterval } from 'date-fns';

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
    router.push(`/dashboard/user-settings/profile/${userId}`);
  };

  const handleError = (error: any, context: string, retryAction?: () => void) => {
    console.error(`Error in ${context}:`, error);
    const isNetworkError =
      error?.code === 'unavailable' ||
      String(error?.message).toLowerCase().includes('network') ||
      String(error).toLowerCase().includes('network');
    
    toast({
      title: `Fout bij ${context}`,
      description: error?.message || String(error),
      variant: 'destructive',
      action: retryAction && isNetworkError ? (
        <ToastAction altText="Probeer opnieuw" onClick={retryAction}>
          Probeer opnieuw
        </ToastAction>
      ) : undefined,
    });
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
      handleError(e, 'laden van taken');
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
    };
  }, [user, currentOrganization, orgLoading, projects, currentUserPermissions, currentUserRole]);

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
    if (!user || !currentOrganization) { handleError({ message: 'Selecteer een organisatie.' }, 'toevoegen taak'); return false; }
    const { data, error } = await TaskCrudActions.createTaskAction(currentOrganization.id, user.id, user.name, taskData);
    if (error) { handleError(error, 'opslaan taak', () => addTask(taskData)); return false; }
    
    return !!data?.success;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !currentOrganization) return;
    
    if (updates.status === 'Voltooid') {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate?.status !== 'Voltooid') {
             triggerHapticFeedback([100, 30, 100]);
        }
    }
    
    const { data, error } = await TaskCrudActions.updateTaskAction(taskId, updates, user.id, currentOrganization.id);
    if (error) handleError(error, 'bijwerken taak', () => updateTask(taskId, updates));
  };

  const cloneTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskCrudActions.cloneTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'klonen taak', () => cloneTask(taskId)); } 
    else { toast({ title: 'Taak Gekloond!', description: `Een kopie van "${data?.clonedTaskTitle}" is aangemaakt.` }); }
  };

  const splitTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskCrudActions.splitTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'splitsen taak', () => splitTask(taskId)); } 
    else { toast({ title: 'Taak gesplitst!', description: `Een nieuwe taak is aangemaakt.` }); }
  };

  const deleteTaskPermanently = async (taskId: string) => {
    if (!currentOrganization) return;
    const { data, error } = await TaskCrudActions.deleteTaskPermanentlyAction(taskId, currentOrganization.id);
    if (error) { handleError(error, 'verwijderen taak', () => deleteTaskPermanently(taskId)); }
    else { 
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast({ title: 'Taak Permanent Verwijderd', variant: 'destructive' }); 
    }
  };

  const rateTask = async (taskId: string, rating: number) => {
    if (!user || !currentOrganization) return;
    const taskToRate = tasks.find(t => t.id === taskId);
    if (!taskToRate) return;
    const result = await rateTaskAction(taskId, rating, taskToRate, user.id, currentOrganization.id);
    if (result.error) { handleError({ message: result.error }, 'beoordelen taak', () => rateTask(taskId, rating)); }
    else { 
        toast({ title: 'Taak beoordeeld!', description: `Bonuspunten gegeven.` }); 
        triggerHapticFeedback([50, 50, 50]);
    }
  };

  const thankForTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const taskAssignees = tasks.find(t => t.id === taskId)?.assigneeIds || [];
    const fullAssigneeInfo = users.filter(u => taskAssignees.includes(u.id));

    const { data, error } = await thankForTaskAction(taskId, user.id, fullAssigneeInfo, currentOrganization.id);
    if (error) { handleError({ message: error }, 'bedanken voor taak', () => thankForTask(taskId)); }
    else if (data) { 
        toast({ title: 'Bedankt!', description: `Bonuspunten gegeven aan ${data.assigneesNames}.` }); 
        triggerHapticFeedback(200);
    }
  };
  
  const reorderTasks = async (tasksToUpdate: {id: string, order: number}[]) => {
    const { error } = await TaskStateActions.reorderTasksAction(tasksToUpdate);
    if (error) handleError(error, 'herordenen taken', () => reorderTasks(tasksToUpdate));
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!user || !currentOrganization) return;
    const { error } = await TaskStateActions.toggleSubtaskCompletionAction(taskId, subtaskId, user.id, currentOrganization.id);
    if (error) handleError(error, 'bijwerken subtaak', () => toggleSubtaskCompletion(taskId, subtaskId));
  };
  
  const toggleTaskTimer = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { error } = await TaskTimerActions.toggleTaskTimerAction(taskId, user.id, currentOrganization.id);
    if (error) handleError(error, 'tijdregistratie', () => toggleTaskTimer(taskId));
  };

  const resetSubtasks = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskStateActions.resetSubtasksAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'resetten subtaken', () => resetSubtasks(taskId)); }
    else if (data?.success) { 
        toast({ title: 'Subtaken gereset!', description: `Alle subtaken voor "${data.taskTitle}" zijn gereset.` }); 
    }
  };

  const setChoreOfTheWeek = async (taskId: string) => {
    if (!currentOrganization) return;
    const { data, error } = await TaskCrudActions.updateTaskAction(taskId, { isChoreOfTheWeek: true }, user?.id || 'system', currentOrganization.id);
    if (error) { handleError(error, 'instellen klus v/d week', () => setChoreOfTheWeek(taskId)); }
    else { toast({ title: 'Klus van de Week ingesteld!' }); }
  };

  const promoteSubtaskToTask = async (parentTaskId: string, subtask: Subtask) => {
    if (!user) return;
    const { data, error } = await TaskStateActions.promoteSubtaskToTask(parentTaskId, subtask, user.id);
    if (error) {
      handleError(error, 'promoveren subtaak', () => promoteSubtaskToTask(parentTaskId, subtask));
    } else if (data?.success) {
      toast({
        title: 'Subtaak Gepromoveerd!',
        description: `"${data.newTastTitle}" is nu een losstaande taak.`
      });
    }
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments' | 'labels'>> & { addLabels?: string[], removeLabels?: string[] }) => {
    if (!user || !currentOrganization) return;
    
    const batch = writeBatch(db);
    const historyEntry = {
        id: crypto.randomUUID(),
        userId: user.id,
        timestamp: new Date(),
        action: 'Bulk bewerking',
        details: `Taken bijgewerkt.`,
    };
    
    taskIds.forEach(taskId => {
      const taskRef = doc(db, 'tasks', taskId);
      const { addLabels, removeLabels, ...otherUpdates } = updates;
      const finalUpdates: any = { ...otherUpdates, history: arrayUnion(historyEntry) };

      if (addLabels && addLabels.length > 0) {
        finalUpdates.labels = arrayUnion(...addLabels);
      }
      if (removeLabels && removeLabels.length > 0) {
        if (finalUpdates.labels) {
            console.warn("Cannot add and remove labels in the same bulk update. Add operation will take precedence.");
        } else {
             finalUpdates.labels = arrayRemove(...removeLabels);
        }
      }
      
      batch.update(taskRef, finalUpdates);
    });

    try {
      await batch.commit();
      toast({ title: 'Bulk actie succesvol!', description: `${taskIds.length} taken zijn bijgewerkt.` });
    } catch (e) {
      handleError(e, 'bulk bijwerken taken', () => bulkUpdateTasks(taskIds, updates));
    }
  };

  const toggleMuteTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const result = await toggleMuteTaskAction(currentOrganization.id, user.id, taskId);
    if (result.error) { handleError({ message: result.error }, 'dempen taak', () => toggleMuteTask(taskId)); }
    else { toast({ title: `Taak ${result.data?.newState === 'muted' ? 'gedempt' : 'dempen opgeheven'}` }); }
  };

  const toggleCommentReaction = async (taskId: string, commentId: string, emoji: string) => {
    if (!user) return;
    const { error } = await CommentActions.toggleCommentReactionAction(taskId, commentId, emoji, user.id);
    if (error) {
        handleError({ message: error }, 'reageren op commentaar');
    }
  };

  const voteOnPoll = async (taskId: string, optionId: string) => {
    if (!user || !currentOrganization) return;
    const { error } = await TaskCollaborationActions.voteOnPollAction(taskId, optionId, user.id, currentOrganization.id);
    if (error) {
        handleError({ message: error }, 'stemmen op poll');
    }
  };

  const handOffTask = async (taskId: string, fromUserId: string, toUserId: string, message: string = ''): Promise<boolean> => {
    const { data, error } = await TaskCollaborationActions.handOffTaskAction(taskId, fromUserId, toUserId, message);
    if (error) {
        handleError(error, 'overdragen taak', () => handOffTask(taskId, fromUserId, toUserId, message));
        return false;
    }
    return !!data?.success;
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
