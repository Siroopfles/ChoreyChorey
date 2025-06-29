

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import type { Task, TaskFormValues, User, Status, Label, Automation, AutomationFormValues, TaskTemplate, TaskTemplateFormValues, Subtask, Project } from '@/lib/types';
import { PERMISSIONS, ROLE_GUEST } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
import { useOrganization } from './organization-context';
import * as TaskActions from '@/app/actions/task.actions';
import { addTemplate as addTemplateAction, updateTemplate as updateTemplateAction, deleteTemplate as deleteTemplateAction } from '@/app/actions/template.actions';
import { manageAutomation as manageAutomationAction } from '@/app/actions/automation.actions';
import { toggleMuteTask as toggleMuteTaskAction } from '@/app/actions/member.actions';
import { thankForTask as thankForTaskAction, rateTask as rateTaskAction } from '@/app/actions/gamification.actions';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

type TaskContextType = {
  tasks: Task[];
  templates: TaskTemplate[];
  automations: Automation[];
  loading: boolean;
  isMoreLoading: boolean;
  hasMoreTasks: boolean;
  loadMoreTasks: () => void;
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
  addTemplate: (templateData: TaskTemplateFormValues) => Promise<void>;
  updateTemplate: (templateId: string, templateData: TaskTemplateFormValues) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  setChoreOfTheWeek: (taskId: string) => Promise<void>;
  promoteSubtaskToTask: (parentTaskId: string, subtask: Subtask) => Promise<void>;
  navigateToUserProfile: (userId: string) => void;
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
  viewedTask: Task | null;
  setViewedTask: (task: Task | null) => void;
  toggleMuteTask: (taskId: string) => Promise<void>;
  manageAutomation: (action: 'create' | 'update' | 'delete', data: AutomationFormValues, automation?: Automation) => Promise<{ success: boolean; }>;
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
        activeTimerStartedAt: (data.activeTimerStartedAt as Timestamp)?.toDate(),
        history: (data.history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })),
        comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate(), readBy: c.readBy || [] })),
    };
    
    // Mask sensitive data
    const projectIsSensitive = task.projectId ? projects.find(p => p.id === task.projectId)?.isSensitive : false;
    if ((task.isSensitive || projectIsSensitive) && !canViewSensitive) {
        return { ...task, title: '[Gevoelige Taak]', description: 'U heeft geen permissie om de details van deze taak te zien.', subtasks: task.subtasks.map(st => ({...st, text: '[Verborgen]'})) };
    }
    
    // Filter private subtasks
    task.subtasks = task.subtasks.filter(st => !st.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id);
    
    return task;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization, currentUserRole, currentUserPermissions, projects, loading: orgLoading } = useOrganization();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const navigateToUserProfile = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };

  const handleError = (error: any, context: string, retryAction?: () => void) => {
    console.error(`Error in ${context}:`, error);
    // More robust check for network-related errors from Firestore or other network issues.
    const isNetworkError =
      error?.code === 'unavailable' ||
      String(error?.message).toLowerCase().includes('network') ||
      String(error).toLowerCase().includes('network');
    
    toast({
      title: `Fout bij ${context}`,
      description: error?.message || String(error),
      variant: 'destructive',
      action: isNetworkError && retryAction ? (
        <ToastAction altText="Probeer opnieuw" onClick={retryAction}>
          Probeer opnieuw
        </ToastAction>
      ) : undefined,
    });
  };
  
  const fetchTasks = useCallback(async (initial = false) => {
    if (!currentOrganization || !user) return;
    if (!initial && (!hasMoreTasks || isMoreLoading)) return;

    if (initial) setLoading(true); else setIsMoreLoading(true);

    const isGuest = currentUserRole === ROLE_GUEST;
    let tasksQuery;

    const baseQueryConstraints = [where("organizationId", "==", currentOrganization.id), orderBy('createdAt', 'desc')];
    
    if (isGuest) {
      const guestAccess = currentOrganization.settings?.guestAccess?.[user.id];
      const projectIds = guestAccess?.projectIds || [];
      if (projectIds.length > 0) {
        baseQueryConstraints.push(where("projectId", "in", projectIds));
      } else {
        baseQueryConstraints.push(where('id', '==', 'guest-has-no-access'));
      }
    }
    
    const paginatedQueryConstraints = [...baseQueryConstraints];
    if (!initial && lastDoc) {
      paginatedQueryConstraints.push(startAfter(lastDoc));
    }
    paginatedQueryConstraints.push(limit(50));

    tasksQuery = query(collection(db, 'tasks'), ...paginatedQueryConstraints);
    
    try {
      const snapshot = await getDocs(tasksQuery);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(newLastDoc || null);
      setHasMoreTasks(snapshot.docs.length === 50);

      const canViewSensitive = currentUserPermissions.includes(PERMISSIONS.VIEW_SENSITIVE_DATA);
      const tasksData = snapshot.docs
        .map(doc => processTaskDoc(doc, projects, canViewSensitive, user))
        .filter(task => !task.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id);
        
      setTasks(prev => initial ? tasksData : [...prev, ...tasksData]);
    } catch(e) {
      handleError(e, 'laden van taken', () => fetchTasks(initial));
    } finally {
      if(initial) setLoading(false); else setIsMoreLoading(false);
    }

  }, [user, currentOrganization, currentUserRole, projects, currentUserPermissions, lastDoc, hasMoreTasks, isMoreLoading]);

  useEffect(() => {
    if (orgLoading) {
      setLoading(true);
      return;
    }
    
    if (!currentOrganization || !user) {
      setTasks([]); setTemplates([]); setAutomations([]); setLoading(false);
      return;
    }

    fetchTasks(true);

    const commonQuery = (collectionName: string) => query(collection(db, collectionName), where("organizationId", "==", currentOrganization.id));
    const unsubTemplates = onSnapshot(commonQuery('taskTemplates'), (s) => setTemplates(s.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate()} as TaskTemplate))), (e) => handleError(e, 'laden van templates'));
    const unsubAutomations = onSnapshot(commonQuery('automations'), (s) => setAutomations(s.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate() } as Automation))), (e) => handleError(e, 'laden van automatiseringen'));
    
    return () => { unsubTemplates(); unsubAutomations(); };
  }, [user, currentOrganization, orgLoading]);
  
  const loadMoreTasks = useCallback(() => {
    fetchTasks(false);
  }, [fetchTasks]);

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }): Promise<boolean> => {
    if (!user || !currentOrganization) { handleError({ message: 'Selecteer een organisatie.' }, 'toevoegen taak'); return false; }
    const { data, error } = await TaskActions.createTaskAction(currentOrganization.id, user.id, user.name, taskData);
    if (error) { handleError(error, 'opslaan taak', () => addTask(taskData)); return false; }
    
    if (data?.taskId) {
      const newTaskDoc = await getDoc(doc(db, 'tasks', data.taskId));
      if (newTaskDoc.exists()) {
        const canViewSensitive = currentUserPermissions.includes(PERMISSIONS.VIEW_SENSITIVE_DATA);
        const newTask = processTaskDoc(newTaskDoc, projects, canViewSensitive, user);
        setTasks(prevTasks => [newTask, ...prevTasks]);
      }
    }
    return !!data?.success;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !currentOrganization) return;
    
    const originalTasks = [...tasks];
    const taskToUpdate = originalTasks.find(t => t.id === taskId);
    if (!taskToUpdate) {
        console.error("Optimistic update failed: Task not found in local state.");
        return;
    }
    
    // Create a deep copy for the optimistic update to avoid mutation issues
    const newTasks = originalTasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(newTasks);

    const { data, error } = await TaskActions.updateTaskAction(taskId, updates, user.id, currentOrganization.id);
    
    if (error) {
        handleError(error, 'bijwerken taak', () => updateTask(taskId, updates));
        // Revert on error
        setTasks(originalTasks);
    } else if (data?.updatedTask) {
        // Re-sync with the server's response to ensure consistency (e.g., for history entries)
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data.updatedTask } : t));
    }
  };

  const cloneTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.cloneTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'klonen taak', () => cloneTask(taskId)); } 
    else { toast({ title: 'Taak Gekloond!', description: `Een kopie van "${data?.clonedTaskTitle}" is aangemaakt.` }); }
  };

  const splitTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.splitTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'splitsen taak', () => splitTask(taskId)); } 
    else { toast({ title: 'Taak gesplitst!', description: `Een nieuwe taak is aangemaakt.` }); }
  };

  const deleteTaskPermanently = async (taskId: string) => {
    if (!currentOrganization) return;
    const { data, error } = await TaskActions.deleteTaskPermanentlyAction(taskId, currentOrganization.id);
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
    if (result.error) { handleError(result.error, 'beoordelen taak', () => rateTask(taskId, rating)); }
    else { toast({ title: 'Taak beoordeeld!', description: `Bonuspunten gegeven.` }); }
  };

  const thankForTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const taskAssignees = tasks.find(t => t.id === taskId)?.assigneeIds || [];
    const fullAssigneeInfo = users.filter(u => taskAssignees.includes(u.id));

    const { data, error } = await thankForTaskAction(taskId, user.id, fullAssigneeInfo, currentOrganization.id);
    if (error) { handleError(error, 'bedanken voor taak', () => thankForTask(taskId)); }
    else if (data) { toast({ title: 'Bedankt!', description: `Bonuspunten gegeven aan ${data.assigneesNames}.` }); }
  };
  
  const reorderTasks = async (tasksToUpdate: {id: string, order: number}[]) => {
    const originalTasks = [...tasks];
      
    // Optimistically update the UI
    setTasks(prevTasks => {
      const tasksMap = new Map(prevTasks.map(t => [t.id, t]));
      tasksToUpdate.forEach(update => {
        const task = tasksMap.get(update.id);
        if(task) {
          tasksMap.set(update.id, { ...task, order: update.order });
        }
      });
      return Array.from(tasksMap.values());
    });
    
    // Call server in the background
    const { data, error } = await TaskActions.reorderTasksAction(tasksToUpdate);
    if (error) {
      handleError(error, 'herordenen taken', () => reorderTasks(tasksToUpdate));
      // Revert on error
      setTasks(originalTasks);
    }
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!user || !currentOrganization) return;
    
    const originalTasks = [...tasks];
    const taskToUpdate = originalTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    // Update the UI immediately
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            const newSubtasks = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
            return { ...t, subtasks: newSubtasks };
        }
        return t;
    }));

    // Call the server action in the background
    const { data, error } = await TaskActions.toggleSubtaskCompletionAction(taskId, subtaskId, user.id, currentOrganization.id);

    // If it fails, revert the change and show a toast
    if (error) {
      handleError(error, 'bijwerken subtaak', () => toggleSubtaskCompletion(taskId, subtaskId));
      setTasks(originalTasks); // Revert to the old state
    }
  };
  
  const toggleTaskTimer = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    
    const originalTasks = [...tasks];
    const taskToUpdate = originalTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const isStarting = !taskToUpdate.activeTimerStartedAt;
    let newTimeLogged = taskToUpdate.timeLogged || 0;
    
    if (!isStarting) {
        // If stopping, calculate elapsed time optimistically
        const startTime = (taskToUpdate.activeTimerStartedAt as Date).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        newTimeLogged += elapsed;
    }
    
    const optimisticUpdate = {
        activeTimerStartedAt: isStarting ? new Date() : null,
        timeLogged: isStarting ? (taskToUpdate.timeLogged || 0) : newTimeLogged,
    };
    
    // Update UI immediately
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...optimisticUpdate } : t));

    // Call server in the background
    const { error } = await TaskActions.toggleTaskTimerAction(taskId, user.id, currentOrganization.id);
    
    if (error) {
        handleError(error, 'tijdregistratie', () => toggleTaskTimer(taskId));
        setTasks(originalTasks); // Revert on error
    }
  };

  const resetSubtasks = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.resetSubtasksAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'resetten subtaken', () => resetSubtasks(taskId)); }
    else if (data?.success) { 
        toast({ title: 'Subtaken gereset!', description: `Alle subtaken voor "${data.taskTitle}" zijn gereset.` }); 
    }
  };

  const setChoreOfTheWeek = async (taskId: string) => {
    if (!currentOrganization) return;
    const { data, error } = await TaskActions.setChoreOfTheWeekAction(taskId, currentOrganization.id);
    if (error) { handleError(error, 'instellen klus v/d week', () => setChoreOfTheWeek(taskId)); }
    else { toast({ title: 'Klus van de Week ingesteld!' }); }
  };

  const promoteSubtaskToTask = async (parentTaskId: string, subtask: Subtask) => {
    if (!user) return;
    const { data, error } = await TaskActions.promoteSubtaskToTask(parentTaskId, subtask, user.id);
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
  
  const addTemplate = async (templateData: TaskTemplateFormValues) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await addTemplateAction(currentOrganization.id, user.id, templateData);
    if (error) { handleError(error, 'template toevoegen', () => addTemplate(templateData)); }
  };

  const updateTemplate = async (templateId: string, templateData: TaskTemplateFormValues) => {
    const { data, error } = await updateTemplateAction(templateId, templateData);
    if (error) { handleError(error, 'template bijwerken', () => updateTemplate(templateId, templateData)); }
  };

  const deleteTemplate = async (templateId: string) => {
    const { data, error } = await deleteTemplateAction(templateId);
    if (error) { handleError(error, 'template verwijderen', () => deleteTemplate(templateId)); }
  };
  
  const manageAutomation = async (action: 'create' | 'update' | 'delete', data: AutomationFormValues, automation?: Automation) => {
    if (!user || !currentOrganization) {
      handleError({ message: 'Niet geautoriseerd' }, 'beheren automatisering');
      return { success: false };
    }
    const result = await manageAutomationAction(action, currentOrganization.id, user.id, {
      automationId: automation?.id,
      data: data,
    });
    if (result.error) {
      handleError(result.error, 'beheren automatisering', () => manageAutomation(action, data, automation));
      return { success: false };
    }
    toast({ title: 'Gelukt!', description: `Automatisering is ${action === 'create' ? 'aangemaakt' : 'bijgewerkt'}.`});
    return { success: true };
  };

  const toggleMuteTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const result = await toggleMuteTaskAction(currentOrganization.id, user.id, taskId);
    if (result.error) { handleError(result.error, 'dempen taak', () => toggleMuteTask(taskId)); }
    else { toast({ title: `Taak ${result.data?.newState === 'muted' ? 'gedempt' : 'dempen opgeheven'}` }); }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, templates, automations, loading, isMoreLoading, hasMoreTasks, loadMoreTasks, addTask, updateTask, rateTask, toggleSubtaskCompletion,
      toggleTaskTimer, reorderTasks, resetSubtasks, thankForTask,
      addTemplate, updateTemplate, deleteTemplate, setChoreOfTheWeek, promoteSubtaskToTask,
      bulkUpdateTasks, cloneTask, splitTask, deleteTaskPermanently,
      navigateToUserProfile, isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask, 
      toggleMuteTask, manageAutomation,
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
