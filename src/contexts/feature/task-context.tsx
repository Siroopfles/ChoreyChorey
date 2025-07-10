

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
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
import { useRouter } from 'next/navigation';
import { isWithinInterval } from 'date-fns';
import { handleServerAction } from '@/lib/utils/action-wrapper';

// Import all required types from their new modular locations
import type { User } from '@/lib/types/auth';
import type { Task, Status, Label, Priority, Subtask } from '@/lib/types/tasks';
import type { Project } from '@/lib/types/projects';
import { PERMISSIONS, ROLE_GUEST } from '@/lib/types/permissions';
import { processTaskDoc } from '@/lib/utils/task-processor';
import * as TaskCrudActions from '@/app/actions/project/task-crud.actions';
import * as TaskStateActions from '@/app/actions/project/task-state.actions';
import { STATUS_COMPLETED, STATUS_TODO } from '@/lib/core/constants';
import { useView } from '../system/view-context';


type GroupedTasks = {
  title: string;
  tasks: Task[];
}

type TaskContextType = {
  tasks: Task[];
  filteredTasks: Task[];
  groupedTasks: GroupedTasks[];
  loading: boolean;
  navigateToUserProfile: (userId: string) => void;
  groupBy: 'status' | 'assignee' | 'priority' | 'project';
  setGroupBy: (groupBy: 'status' | 'assignee' | 'priority' | 'project') => void;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTaskPermanently: (taskId: string) => Promise<void>;
  promoteSubtaskToTask: (taskId: string, subtask: Subtask) => Promise<void>;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => Promise<void>;
  handOffTask: (taskId: string, fromUserId: string, toUserId: string, message?: string) => Promise<boolean>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization, currentUserRole, currentUserPermissions, projects, users, loading: orgLoading } = useOrganization();
  const { filters, searchTerm, dateRange } = useFilters();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority' | 'project'>('status');
  const { triggerConfetti } = useView();
  
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
        limit(500)
    );
    
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs
        .map(doc => processTaskDoc(doc, projects, canViewSensitive, user))
        .filter(task => !task.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Client-side sort
      
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

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    const oldTask = tasks.find(t => t.id === taskId);
    if (updates.status === STATUS_COMPLETED && oldTask?.status !== STATUS_COMPLETED) {
      triggerConfetti();
    }
    const result = await handleServerAction(
      () => TaskCrudActions.updateTaskAction(taskId, updates, user.id, currentOrganization.id),
      toast,
      { successToast: { title: 'Taak bijgewerkt!' }, errorContext: 'taak bijwerken' }
    );
    return !result.error;
  };
  
  const deleteTaskPermanently = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
      () => TaskCrudActions.deleteTaskPermanentlyAction(taskId, currentOrganization.id),
      toast,
      { successToast: { title: 'Taak permanent verwijderd' }, errorContext: 'permanent verwijderen taak' }
    );
  };
  
  const promoteSubtaskToTask = async (taskId: string, subtask: Subtask) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
      () => TaskStateActions.promoteSubtaskToTask(taskId, subtask, user.id),
      toast,
      {
        successToast: {
          title: 'Subtaak gepromoveerd!',
          description: (data) => `"${(data as any).newTastTitle}" is nu een losstaande taak.`
        },
        errorContext: 'promoveren subtaak'
      }
    );
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!user || !currentOrganization) return;
    await handleServerAction(
      () => TaskStateActions.toggleSubtaskCompletionAction(taskId, subtaskId, user.id, currentOrganization.id),
      toast,
      { errorContext: 'subtaak bijwerken' }
    );
  };

  const handOffTask = async (taskId: string, fromUserId: string, toUserId: string, message?: string) => {
     if (!user || !currentOrganization) return false;
     const result = await handleServerAction(
        () => TaskStateActions.handOffTaskAction(taskId, fromUserId, toUserId, message),
        toast,
        {
          successToast: { title: 'Taak Overgedragen!', description: () => `De taak is succesvol overgedragen.` },
          errorContext: 'taak overdragen'
        }
     );
     return !result.error;
  };
  
  const value = { 
    tasks, filteredTasks, groupedTasks, loading, navigateToUserProfile,
    groupBy, setGroupBy, updateTask, deleteTaskPermanently,
    promoteSubtaskToTask, toggleSubtaskCompletion, handOffTask
  };
  
  return (
    <TaskContext.Provider value={value}>
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
