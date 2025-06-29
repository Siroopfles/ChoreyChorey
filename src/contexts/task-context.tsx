
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
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
} from 'firebase/firestore';
import type { Task, TaskFormValues, User, Status, Label, Automation, AutomationFormValues, TaskTemplate, TaskTemplateFormValues, Subtask } from '@/lib/types';
import { PERMISSIONS } from '@/lib/types';
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


type TaskContextType = {
  tasks: Task[];
  templates: TaskTemplate[];
  automations: Automation[];
  loading: boolean;
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  rateTask: (taskId: string, rating: number) => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments' | 'labels'>> & { addLabels?: string[], removeLabels?: string[] }) => void;
  cloneTask: (taskId: string) => void;
  splitTask: (taskId: string) => Promise<void>;
  deleteTaskPermanently: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  toggleTaskTimer: (taskId: string) => void;
  reorderTasks: (tasksToUpdate: {id: string, order: number}[]) => void;
  resetSubtasks: (taskId: string) => void;
  thankForTask: (taskId: string) => Promise<void>;
  addTemplate: (templateData: TaskTemplateFormValues) => Promise<void>;
  updateTemplate: (templateId: string, templateData: TaskTemplateFormValues) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  setChoreOfTheWeek: (taskId: string) => Promise<void>;
  promoteSubtaskToTask: (parentTaskId: string, subtask: Subtask) => void;
  navigateToUserProfile: (userId: string) => void;
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
  viewedTask: Task | null;
  setViewedTask: (task: Task | null) => void;
  toggleMuteTask: (taskId: string) => void;
  manageAutomation: (action: 'create' | 'update' | 'delete', data: AutomationFormValues, automation?: Automation) => Promise<{ success: boolean; }>;
  toggleTaskPin: (taskId: string, isPinned: boolean) => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const { currentOrganization, currentUserRole, currentUserPermissions, projects, loading: orgLoading } = useOrganization();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const navigateToUserProfile = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({ title: `Fout bij ${context}`, description: error.message || error, variant: 'destructive' });
  };
  
  useEffect(() => {
    if (orgLoading) {
      setLoading(true);
      return;
    }

    if (!currentOrganization || !user) {
      setTasks([]); setTemplates([]); setAutomations([]); setLoading(false);
      return;
    }
    setLoading(true);

    const isGuest = currentUserRole === 'Guest';
    let tasksQuery;

    if (isGuest) {
      const guestAccess = currentOrganization.settings?.guestAccess?.[user.id];
      const projectIds = guestAccess?.projectIds || [];
      if (projectIds.length > 0) {
        tasksQuery = query(collection(db, 'tasks'), where("projectId", "in", projectIds));
      } else {
        tasksQuery = query(collection(db, 'tasks'), where('id', '==', 'guest-has-no-access'));
      }
    } else {
      tasksQuery = query(collection(db, 'tasks'), where("organizationId", "==", currentOrganization.id));
    }

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      let tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp)?.toDate(), dueDate: (doc.data().dueDate as Timestamp)?.toDate(), completedAt: (doc.data().completedAt as Timestamp)?.toDate(), activeTimerStartedAt: (doc.data().activeTimerStartedAt as Timestamp)?.toDate(), history: (doc.data().history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })), comments: (doc.data().comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate(), readBy: c.readBy || [] })) } as Task));
      
      const canViewSensitive = currentUserPermissions.includes(PERMISSIONS.VIEW_SENSITIVE_DATA);
      const projectsMap = new Map(projects.map(p => [p.id, p]));

      tasksData = tasksData.filter(task => !task.isPrivate || task.assigneeIds.includes(user.id) || task.creatorId === user.id)
        .map(task => {
          const projectIsSensitive = task.projectId ? projectsMap.get(task.projectId)?.isSensitive : false;
          if ((task.isSensitive || projectIsSensitive) && !canViewSensitive) {
            return { ...task, title: '[Gevoelige Taak]', description: 'U heeft geen permissie om de details van deze taak te zien.', subtasks: task.subtasks.map(st => ({...st, text: '[Verborgen]'})) };
          }
          return task;
        });
      setTasks(tasksData);
      setLoading(false);
    }, (e) => handleError(e, 'laden van taken'));

    const commonQuery = (collectionName: string) => query(collection(db, collectionName), where("organizationId", "==", currentOrganization.id));

    const unsubTemplates = onSnapshot(commonQuery('taskTemplates'), (s) => setTemplates(s.docs.map(d => ({...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate()} as TaskTemplate))), (e) => handleError(e, 'laden van templates'));
    const unsubAutomations = onSnapshot(commonQuery('automations'), (s) => setAutomations(s.docs.map(d => ({ ...d.data(), id: d.id, createdAt: (d.data().createdAt as Timestamp).toDate() } as Automation))), (e) => handleError(e, 'laden van automatiseringen'));

    return () => { unsubTasks(); unsubTemplates(); unsubAutomations(); };
  }, [user, currentOrganization, currentUserRole, currentUserPermissions, projects, orgLoading]);

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }): Promise<boolean> => {
    if (!user || !currentOrganization) { handleError({ message: 'Selecteer een organisatie.' }, 'toevoegen taak'); return false; }
    const { data, error } = await TaskActions.createTaskAction(currentOrganization.id, user.id, user.name, taskData);
    if (error) { handleError(error, 'opslaan taak'); return false; }
    return !!data?.success;
  };
  
  const cloneTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.cloneTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'klonen taak'); } 
    else { toast({ title: 'Taak Gekloond!', description: `Een kopie van "${data?.clonedTaskTitle}" is aangemaakt.` }); }
  };

  const splitTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.splitTaskAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'splitsen taak'); } 
    else { toast({ title: 'Taak gesplitst!', description: `Een nieuwe taak is aangemaakt.` }); }
  };

  const deleteTaskPermanently = async (taskId: string) => {
    if (!currentOrganization) return;
    const { data, error } = await TaskActions.deleteTaskPermanentlyAction(taskId, currentOrganization.id);
    if (error) { handleError(error, 'verwijderen taak'); }
    else { toast({ title: 'Taak Permanent Verwijderd', variant: 'destructive' }); }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.updateTaskAction(taskId, updates, user.id, currentOrganization.id);
    if (error) handleError(error, 'bijwerken taak');
  };

  const rateTask = async (taskId: string, rating: number) => {
    if (!user || !currentOrganization) return;
    const result = await rateTaskAction(taskId, rating, tasks.find(t => t.id === taskId)!, user.id, currentOrganization.id);
    if (result.error) { handleError({ message: result.error }, 'beoordelen taak'); }
    else { toast({ title: 'Taak beoordeeld!', description: `Bonuspunten gegeven.` }); }
  };

  const thankForTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const taskAssignees = tasks.find(t => t.id === taskId)?.assigneeIds || [];
    const fullAssigneeInfo = users.filter(u => taskAssignees.includes(u.id));

    const { data, error } = await thankForTaskAction(taskId, user.id, fullAssigneeInfo, currentOrganization.id);
    if (error) { handleError({ message: error }, 'bedanken voor taak'); }
    else if (data) { toast({ title: 'Bedankt!', description: `Bonuspunten gegeven aan ${data.assigneesNames}.` }); }
  };
  
  const reorderTasks = async (tasksToUpdate: {id: string, order: number}[]) => {
      const { error } = await TaskActions.reorderTasksAction(tasksToUpdate);
      if (error) handleError(error, 'herordenen taken');
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!user || !currentOrganization) return;
    const { error } = await TaskActions.toggleSubtaskCompletionAction(taskId, subtaskId, user.id, currentOrganization.id);
    if (error) handleError(error, 'bijwerken subtaak');
  };
  
  const toggleTaskTimer = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { error } = await TaskActions.toggleTaskTimerAction(taskId, user.id, currentOrganization.id);
    if (error) handleError(error, 'tijdregistratie');
  };

  const resetSubtasks = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const { data, error } = await TaskActions.resetSubtasksAction(taskId, user.id, currentOrganization.id);
    if (error) { handleError(error, 'resetten subtaken'); }
    else if (data?.success) { toast({ title: 'Subtaken gereset!', description: `Alle subtaken voor "${data.taskTitle}" zijn gereset.` }); }
  };

  const setChoreOfTheWeek = async (taskId: string) => {
    if (!currentOrganization) return;
    const { error } = await TaskActions.setChoreOfTheWeekAction(taskId, currentOrganization.id);
    if (error) { handleError(error, 'instellen klus v/d week'); }
    else { toast({ title: 'Klus van de Week ingesteld!' }); }
  };

  const promoteSubtaskToTask = async (parentTaskId: string, subtask: Subtask) => {
    if (!user) return;
    const { data, error } = await TaskActions.promoteSubtaskToTask(parentTaskId, subtask, user.id);
    if (error) {
      handleError(error, 'promoveren subtaak');
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
      handleError(e, 'bulk bijwerken taken');
    }
  };
  
  const addTemplate = async (templateData: TaskTemplateFormValues) => {
    if (!user || !currentOrganization) return;
    const result = await addTemplateAction(currentOrganization.id, user.id, templateData);
    if (result.error) { handleError({ message: result.error }, 'template toevoegen'); }
  };

  const updateTemplate = async (templateId: string, templateData: TaskTemplateFormValues) => {
    const result = await updateTemplateAction(templateId, templateData);
    if (result.error) { handleError({ message: result.error }, 'template bijwerken'); }
  };

  const deleteTemplate = async (templateId: string) => {
    const result = await deleteTemplateAction(templateId);
    if (result.error) { handleError({ message: result.error }, 'template verwijderen'); }
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
      handleError({ message: result.error }, 'beheren automatisering');
      return { success: false };
    }
    toast({ title: 'Gelukt!', description: `Automatisering is ${action === 'create' ? 'aangemaakt' : 'bijgewerkt'}.`});
    return { success: true };
  };

  const toggleMuteTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const result = await toggleMuteTaskAction(currentOrganization.id, user.id, taskId);
    if (result.error) { handleError({ message: result.error }, 'dempen taak'); }
    else { toast({ title: `Taak ${result.newState === 'muted' ? 'gedempt' : 'dempen opgeheven'}` }); await refreshUser(); }
  };

  const toggleTaskPin = async (taskId: string, isPinned: boolean) => {
    if (!user || !currentOrganization) return;
    if (!currentUserPermissions.includes(PERMISSIONS.PIN_ITEMS)) {
        toast({ title: 'Geen permissie', description: 'Je hebt geen permissie om items vast te pinnen.', variant: 'destructive' });
        return;
    }
    updateTask(taskId, { pinned: isPinned });
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, templates, automations, loading, addTask, updateTask, rateTask, toggleSubtaskCompletion,
      toggleTaskTimer, reorderTasks, resetSubtasks, thankForTask,
      addTemplate, updateTemplate, deleteTemplate, setChoreOfTheWeek, promoteSubtaskToTask,
      bulkUpdateTasks, cloneTask, splitTask, deleteTaskPermanently,
      navigateToUserProfile, isAddTaskDialogOpen, setIsAddTaskDialogOpen, viewedTask, setViewedTask, 
      toggleMuteTask, manageAutomation, toggleTaskPin,
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
