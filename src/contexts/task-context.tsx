
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  writeBatch, 
  getDoc,
  deleteDoc,
  increment,
  FirestoreError,
  query,
  where,
  arrayUnion,
  getDocs,
} from 'firebase/firestore';
import { addDays, addHours, addMonths, isBefore, startOfMonth, getDay, setDate, isAfter, addWeeks } from 'date-fns';
import type { Task, TaskFormValues, User, Status, Label, Filters, Notification, Comment, HistoryEntry, Recurring, TaskTemplate, TaskTemplateFormValues, PersonalGoal, PersonalGoalFormValues, Idea, IdeaFormValues, IdeaStatus, TeamChallenge, TeamChallengeFormValues, Project } from '@/lib/types';
import { ACHIEVEMENTS, PERMISSIONS } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
import { calculatePoints } from '@/lib/utils';
import { triggerWebhooks } from '@/lib/webhook-service';
import { createIdea as createIdeaAction, toggleIdeaUpvote as toggleIdeaUpvoteAction, updateIdeaStatus as updateIdeaStatusAction } from '@/app/actions/ideas.actions';
import { toggleMuteTask as toggleMuteTaskAction } from '@/app/actions/user.actions';

type TaskContextType = {
  tasks: Task[];
  users: User[];
  templates: TaskTemplate[];
  loading: boolean;
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  rateTask: (taskId: string, rating: number) => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments'>>) => void;
  cloneTask: (taskId: string) => void;
  splitTask: (taskId: string) => Promise<void>;
  deleteTaskPermanently: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  toggleTaskTimer: (taskId: string) => void;
  reorderTasks: (tasksToUpdate: {id: string, order: number}[]) => void;
  resetSubtasks: (taskId: string) => void;
  addComment: (taskId: string, text: string) => void;
  markCommentAsRead: (taskId: string, commentId: string) => void;
  thankForTask: (taskId: string) => Promise<void>;
  addTemplate: (templateData: TaskTemplateFormValues) => Promise<void>;
  updateTemplate: (templateId: string, templateData: TaskTemplateFormValues) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  setChoreOfTheWeek: (taskId: string) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleTaskSelection: (taskId: string) => void;
  filters: Filters;
  setFilters: (newFilters: Partial<Filters>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  notifications: Notification[];
  markAllNotificationsAsRead: () => void;
  markSingleNotificationAsRead: (notificationId: string) => void;
  archiveNotification: (notificationId: string) => void;
  snoozeNotification: (notificationId: string) => void;
  viewedUser: User | null;
  setViewedUser: (user: User | null) => void;
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
  personalGoals: PersonalGoal[];
  addPersonalGoal: (goalData: PersonalGoalFormValues) => Promise<boolean>;
  updatePersonalGoal: (goalId: string, goalData: PersonalGoalFormValues) => Promise<boolean>;
  deletePersonalGoal: (goalId: string) => Promise<void>;
  toggleMilestoneCompletion: (goalId: string, milestoneId: string) => Promise<void>;
  ideas: Idea[];
  addIdea: (ideaData: IdeaFormValues) => Promise<boolean>;
  toggleIdeaUpvote: (ideaId: string) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  teamChallenges: TeamChallenge[];
  addTeamChallenge: (challengeData: TeamChallengeFormValues) => Promise<boolean>;
  updateTeamChallenge: (challengeId: string, challengeData: TeamChallengeFormValues) => Promise<boolean>;
  deleteTeamChallenge: (challengeId: string) => Promise<void>;
  completeTeamChallenge: (challengeId: string) => Promise<void>;
  toggleMuteTask: (taskId: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const calculateNextDueDate = (currentDueDate: Date | undefined, recurring: Recurring): Date => {
    const startDate = currentDueDate || new Date();
    // If the due date is in the past, we calculate from today to avoid creating a bunch of overdue tasks.
    const baseDate = isBefore(startDate, new Date()) ? new Date() : startDate;

    switch (recurring.frequency) {
        case 'daily':
            return addDays(baseDate, 1);
        case 'weekly':
            return addWeeks(baseDate, 1);
        case 'monthly':
            const nextMonthDate = addMonths(baseDate, 1);
            const startOfNextMonth = startOfMonth(nextMonthDate);
            
            if (recurring.monthly?.type === 'day_of_month' && recurring.monthly.day) {
                return setDate(startOfNextMonth, recurring.monthly.day);
            }
            
            if (recurring.monthly?.type === 'day_of_week' && recurring.monthly.weekday !== undefined && recurring.monthly.week) {
                const { week, weekday } = recurring.monthly;

                const allMatchingWeekdaysInMonth: Date[] = [];
                let date = startOfNextMonth;
                // Find all instances of the target weekday in the next month
                while(date.getMonth() === startOfNextMonth.getMonth()) {
                    if (getDay(date) === weekday) {
                        allMatchingWeekdaysInMonth.push(new Date(date.getTime()));
                    }
                    date = addDays(date, 1);
                }
                
                if (week === 'last') {
                    return allMatchingWeekdaysInMonth[allMatchingWeekdaysInMonth.length - 1] || addMonths(baseDate, 1);
                }
                
                const weekIndex = { 'first': 0, 'second': 1, 'third': 2, 'fourth': 3 }[week];
                return allMatchingWeekdaysInMonth[weekIndex] || addMonths(baseDate, 1); // Fallback
            }
            // Fallback for misconfigured monthly
            return addMonths(baseDate, 1);
        default:
            return addDays(new Date(), 1);
    }
}


export function TaskProvider({ children }: { children: ReactNode }) {
  const { authUser, user, currentOrganization, users, currentUserPermissions, projects, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filters, setRawFilters] = useState<Filters>({ assigneeId: null, labels: [], priority: null, projectId: null });
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const setFilters = (newFilters: Partial<Filters>) => {
    setRawFilters(prev => ({...prev, ...newFilters}));
  };

  const clearFilters = () => {
      setRawFilters({ assigneeId: null, labels: [], priority: null, projectId: null });
      setSearchTerm('');
  };
  
  const activeFilterCount = (filters.assigneeId ? 1 : 0) + filters.labels.length + (filters.priority ? 1 : 0) + (filters.projectId ? 1 : 0);

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    const description = error instanceof FirestoreError ? `Details: ${error.message} (${error.code})` : 'Een onbekende fout is opgetreden.';
    toast({
        title: `Fout bij ${context}`,
        description,
        variant: 'destructive',
    });
  };

  const addHistoryEntry = (userId: string | null, action: string, details?: string): HistoryEntry => {
    const entry: any = {
        id: crypto.randomUUID(),
        userId: userId || 'system',
        timestamp: new Date(),
        action,
    };
    if (details) {
        entry.details = details;
    }
    return entry;
  };

  useEffect(() => {
    if (!currentOrganization || !authUser) {
      setTasks([]);
      setTemplates([]);
      setPersonalGoals([]);
      setIdeas([]);
      setTeamChallenges([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const qTasks = query(collection(db, 'tasks'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      let tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'Te Doen',
          priority: data.priority || 'Midden',
          assigneeIds: data.assigneeIds || [],
          creatorId: data.creatorId || null,
          projectId: data.projectId || null,
          labels: data.labels || [],
          subtasks: data.subtasks || [],
          attachments: data.attachments || [],
          comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate(), readBy: c.readBy || [] })),
          history: (data.history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })),
          isPrivate: data.isPrivate || false,
          isSensitive: data.isSensitive || false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          dueDate: (data.dueDate as Timestamp)?.toDate(),
          completedAt: (data.completedAt as Timestamp)?.toDate(),
          order: data.order || 0,
          storyPoints: data.storyPoints,
          blockedBy: data.blockedBy || [],
          dependencyConfig: data.dependencyConfig || {},
          recurring: data.recurring,
          organizationId: data.organizationId,
          imageDataUri: data.imageDataUri ?? null,
          thanked: data.thanked || false,
          timeLogged: data.timeLogged || 0,
          activeTimerStartedAt: (data.activeTimerStartedAt as Timestamp)?.toDate(),
          rating: data.rating || null,
          reviewerId: data.reviewerId ?? null,
          consultedUserIds: data.consultedUserIds || [],
          informedUserIds: data.informedUserIds || [],
          isChoreOfTheWeek: data.isChoreOfTheWeek || false,
          helpNeeded: data.helpNeeded || false,
        } as Task;
      });
      
      let processedTasks = tasksData.filter(task => {
        if (!authUser) return false;
        if (task.isPrivate && !task.assigneeIds.includes(authUser.uid) && task.creatorId !== authUser.uid) {
            return false;
        }
        return true;
      });

      // Mask sensitive data
      const canViewSensitive = currentUserPermissions.includes(PERMISSIONS.VIEW_SENSITIVE_DATA);
      const projectsMap = new Map(projects.map(p => [p.id, p]));
      processedTasks = processedTasks.map(task => {
          const projectIsSensitive = task.projectId ? projectsMap.get(task.projectId)?.isSensitive : false;
          if ((task.isSensitive || projectIsSensitive) && !canViewSensitive) {
              return {
                  ...task,
                  title: '[Gevoelige Taak]',
                  description: 'U heeft geen permissie om de details van deze taak te zien.',
                  subtasks: task.subtasks.map(st => ({...st, text: '[Verborgen]'})),
              }
          }
          return task;
      });
      
      setTasks(processedTasks);
      setLoading(false);
    }, (error: FirestoreError) => handleError(error, 'laden van taken'));

    const qTemplates = query(collection(db, 'taskTemplates'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeTemplates = onSnapshot(qTemplates, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        } as TaskTemplate));
        setTemplates(templatesData);
    }, (error: FirestoreError) => handleError(error, 'laden van templates'));

    const qGoals = query(collection(db, 'personalGoals'), where("userId", "==", authUser.uid), where("organizationId", "==", currentOrganization.id));
    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                targetDate: (data.targetDate as Timestamp)?.toDate(),
                milestones: data.milestones || [],
            } as PersonalGoal;
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPersonalGoals(goalsData);
    }, (error: FirestoreError) => handleError(error, 'laden van persoonlijke doelen'));

    const qIdeas = query(collection(db, 'ideas'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeIdeas = onSnapshot(qIdeas, (snapshot) => {
        const ideasData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Idea;
        });
        setIdeas(ideasData);
    }, (error: FirestoreError) => handleError(error, 'laden van ideeën'));
    
    const qChallenges = query(collection(db, 'teamChallenges'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeChallenges = onSnapshot(qChallenges, (snapshot) => {
        const challengesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                completedAt: (data.completedAt as Timestamp)?.toDate(),
            } as TeamChallenge;
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setTeamChallenges(challengesData);
    }, (error: FirestoreError) => handleError(error, 'laden van team uitdagingen'));


    return () => {
        unsubscribeTasks();
        unsubscribeTemplates();
        unsubscribeGoals();
        unsubscribeIdeas();
        unsubscribeChallenges();
    };
  }, [authUser, currentOrganization, toast, currentUserPermissions, projects]);


  useEffect(() => {
    if (!db || !authUser || !currentOrganization) {
      setNotifications([]);
      return;
    };
    
    const q = query(collection(db, "notifications"), where("userId", "==", authUser.uid), where("organizationId", "==", currentOrganization.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                snoozedUntil: (data.snoozedUntil as Timestamp)?.toDate(),
            } as Notification;
        }).filter(n => !n.archived)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(notificationsData);
    }, (error: FirestoreError) => handleError(error, 'laden van notificaties'));

    return () => unsubscribe();
  }, [authUser, currentOrganization, toast]);


  const createNotification = async (userId: string, message: string, taskId: string, organizationId: string) => {
    if (!authUser || userId === authUser.uid) return;
    try {
      const userToNotifyRef = doc(db, 'users', userId);
      const userToNotifyDoc = await getDoc(userToNotifyRef);

      if (userToNotifyDoc.exists()) {
        const userData = userToNotifyDoc.data() as User;
        
        if (userData.mutedTaskIds?.includes(taskId)) {
            console.log(`Notification for ${userData.name} suppressed because task ${taskId} is muted.`);
            return;
        }

        if (userData.status?.type === 'Niet storen') {
          const dndUntil = (userData.status.until as Timestamp | null)?.toDate();
          if (!dndUntil || isAfter(dndUntil, new Date())) {
            // Do not send notification if DND is active indefinitely, or the end date is in the future.
            console.log(`Notification for ${userData.name} suppressed due to DND status.`);
            return;
          }
        }
      }

      await addDoc(collection(db, 'notifications'), {
        userId,
        message,
        taskId,
        organizationId,
        read: false,
        createdAt: new Date(),
      });
    } catch (e) {
      handleError(e, 'maken van notificatie');
    }
  };
  
  const markAllNotificationsAsRead = async () => {
    if (!authUser) return;
    try {
        const batch = writeBatch(db);
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if(unreadIds.length === 0) return;

        unreadIds.forEach(id => {
            const notifRef = doc(db, 'notifications', id);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
    } catch(e) {
        handleError(e, 'bijwerken van notificaties');
    }
  };

  const markSingleNotificationAsRead = async (notificationId: string) => {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { read: true });
    } catch (e) {
        handleError(e, 'bijwerken van notificatie');
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { archived: true });
        toast({ title: 'Notificatie gearchiveerd.' });
    } catch (e) {
        handleError(e, 'archiveren van notificatie');
    }
  };

  const snoozeNotification = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      const snoozeUntil = addHours(new Date(), 1);
      await updateDoc(notifRef, { snoozedUntil: Timestamp.fromDate(snoozeUntil) });
    } catch (e) {
      handleError(e, 'snoozen van notificatie');
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }): Promise<boolean> => {
    if (!authUser || !currentOrganization) {
      toast({ title: 'Geen organisatie geselecteerd', description: 'Selecteer een organisatie voordat je een taak toevoegt.', variant: 'destructive' });
      return false;
    };
    try {
        const history = [addHistoryEntry(authUser.uid, 'Aangemaakt')];
        const firestoreTask: Omit<Task, 'id'> = {
          title: taskData.title,
          description: taskData.description || '',
          assigneeIds: taskData.assigneeIds || [],
          creatorId: authUser.uid,
          projectId: taskData.projectId || null,
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 'Midden',
          isPrivate: taskData.isPrivate || false,
          isSensitive: taskData.isSensitive || false,
          labels: (taskData.labels as Label[]) || [],
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
          attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.name || at.url, type: 'file' as const })) || [],
          comments: [],
          history: history,
          order: Date.now(),
          storyPoints: taskData.storyPoints ?? null,
          blockedBy: taskData.blockedBy || [],
          dependencyConfig: taskData.dependencyConfig || {},
          recurring: taskData.recurring ?? null,
          organizationId: currentOrganization.id,
          imageDataUri: taskData.imageDataUri ?? null,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          completedAt: null,
          rating: null,
          reviewerId: taskData.reviewerId ?? null,
          consultedUserIds: taskData.consultedUserIds || [],
          informedUserIds: taskData.informedUserIds || [],
          helpNeeded: taskData.helpNeeded || false,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        if (firestoreTask.assigneeIds.length > 0) {
            firestoreTask.assigneeIds.forEach(assigneeId => {
              createNotification(
                  assigneeId,
                  `${user?.name} heeft je toegewezen aan: "${firestoreTask.title}"`,
                  docRef.id,
                  currentOrganization.id
              );
            });
        }
        triggerWebhooks(currentOrganization.id, 'task.created', { ...firestoreTask, id: docRef.id });
        return true;
    } catch (e) {
        handleError(e, 'opslaan van taak');
        return false;
    }
  };
  
  const cloneTask = async (taskId: string) => {
    if (!authUser || !currentOrganization) return;
    try {
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        if (!taskDoc.exists()) throw new Error("Task not found");

        const taskToClone = taskDoc.data();
        const clonedTask = {
          ...taskToClone,
          title: `[KLONE] ${taskToClone.title}`,
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          creatorId: authUser.uid,
          completedAt: null,
          comments: [],
          history: [addHistoryEntry(authUser.uid, 'Gekloond', `van taak ${taskId}`)],
          order: Date.now(),
          organizationId: currentOrganization.id,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          rating: null,
          dependencyConfig: taskToClone.dependencyConfig || {},
          consultedUserIds: taskToClone.consultedUserIds || [],
          informedUserIds: taskToClone.informedUserIds || [],
        };
        
        delete (clonedTask as any).id; 

        const docRef = await addDoc(collection(db, 'tasks'), clonedTask);
        toast({
            title: 'Taak Gekloond!',
            description: `Een kopie van "${taskToClone.title}" is aangemaakt.`,
        });
        triggerWebhooks(currentOrganization.id, 'task.created', { ...clonedTask, id: docRef.id });
    } catch (e) {
        handleError(e, 'klonen van taak');
    }
  }

  const splitTask = async (taskId: string) => {
    if (!authUser || !currentOrganization) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            throw new Error("Taak niet gevonden.");
        }

        const originalTask = taskDoc.data();
        if (!originalTask.subtasks || originalTask.subtasks.length < 2) {
            toast({
                title: 'Niet mogelijk',
                description: 'Een taak moet minimaal 2 subtaken hebben om te kunnen splitsen.',
                variant: 'destructive',
            });
            return;
        }

        const splitIndex = Math.ceil(originalTask.subtasks.length / 2);
        const originalSubtasks = originalTask.subtasks.slice(0, splitIndex);
        const newSubtasks = originalTask.subtasks.slice(splitIndex);

        const newTaskData: any = {
            ...originalTask,
            title: `[SPLITSING] ${originalTask.title}`,
            subtasks: newSubtasks,
            createdAt: new Date(),
            order: (originalTask.order || Date.now()) + 1, // Ensure it appears after the original
            history: [addHistoryEntry(authUser.uid, 'Aangemaakt door splitsing', `van taak ${taskId}`)],
            // Reset fields that shouldn't be copied
            comments: [],
            completedAt: null,
            thanked: false,
            timeLogged: 0,
            activeTimerStartedAt: null,
            rating: null,
        };

        const batch = writeBatch(db);

        // Update original task
        batch.update(taskRef, {
            subtasks: originalSubtasks,
            history: arrayUnion(addHistoryEntry(authUser.uid, 'Taak gesplitst', `${newSubtasks.length} subtaken verplaatst naar nieuwe taak.`))
        });
        
        // Create new task
        const newTaskRef = doc(collection(db, 'tasks'));
        batch.set(newTaskRef, newTaskData);

        await batch.commit();

        toast({
            title: 'Taak gesplitst!',
            description: `Een nieuwe taak is aangemaakt met de overige subtaken.`,
        });
        triggerWebhooks(currentOrganization.id, 'task.created', { ...newTaskData, id: newTaskRef.id });
        triggerWebhooks(currentOrganization.id, 'task.updated', { ...originalTask, id: taskRef.id, subtasks: originalSubtasks });

    } catch (e) {
        handleError(e, 'splitsen van taak');
    }
  };

  const deleteTaskPermanently = async (taskId: string) => {
    if (!currentOrganization) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if(!taskDoc.exists()) return;

        const taskData = { ...taskDoc.data(), id: taskId };
        await deleteDoc(taskRef);
        toast({
            title: 'Taak Permanent Verwijderd',
            variant: 'destructive',
        });
        triggerWebhooks(currentOrganization.id, 'task.deleted', taskData);
    } catch (e) {
        handleError(e, 'permanent verwijderen van taak');
    }
  };

  const checkAndGrantAchievements = useCallback(async (userId: string, type: 'completed' | 'thanked', completedTask?: Task) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as User;
    const userAchievements = userData.achievements || [];
    const achievementsToGrant: string[] = [];

    if (type === 'completed' && completedTask) {
        const completedTasksQuery = query(collection(db, 'tasks'), where('assigneeIds', 'array-contains', userId), where('status', '==', 'Voltooid'));
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        const totalCompleted = completedTasksSnapshot.size;

        if (totalCompleted === 1 && !userAchievements.includes(ACHIEVEMENTS.FIRST_TASK.id)) {
            achievementsToGrant.push(ACHIEVEMENTS.FIRST_TASK.id);
            toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.FIRST_TASK.name}" verdiend!` });
        }
        
        if (completedTask.creatorId && completedTask.creatorId !== userId && !userAchievements.includes(ACHIEVEMENTS.COMMUNITY_HELPER.id)) {
            achievementsToGrant.push(ACHIEVEMENTS.COMMUNITY_HELPER.id);
            toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.COMMUNITY_HELPER.name}" verdiend!` });
        }

        if (totalCompleted >= 10 && !userAchievements.includes(ACHIEVEMENTS.TEN_TASKS.id)) {
            achievementsToGrant.push(ACHIEVEMENTS.TEN_TASKS.id);
            toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.TEN_TASKS.name}" verdiend!` });
        }
    }
    
    if (type === 'thanked') {
         if (!userAchievements.includes(ACHIEVEMENTS.APPRECIATED.id)) {
            achievementsToGrant.push(ACHIEVEMENTS.APPRECIATED.id);
            toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.APPRECIATED.name}" verdiend!` });
        }
    }

    if (achievementsToGrant.length > 0) {
        await updateDoc(userRef, {
            achievements: arrayUnion(...achievementsToGrant)
        });
    }
  }, [toast]);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!authUser || !currentOrganization) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        
        const finalUpdates: { [key: string]: any } = { ...updates };
        const newHistory: HistoryEntry[] = [];

        const fieldsToTrack: (keyof Task)[] = ['status', 'assigneeIds', 'priority', 'dueDate', 'title', 'projectId', 'reviewerId'];
        fieldsToTrack.forEach(field => {
            if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(taskToUpdate[field])) {
                let oldValue = field === 'dueDate' ? (taskToUpdate[field] ? (taskToUpdate[field] as Date).toLocaleDateString() : 'geen') : (taskToUpdate[field] || 'leeg');
                let newValue = field === 'dueDate' ? (updates[field] ? (updates[field] as Date).toLocaleDateString() : 'geen') : (updates[field] || 'leeg');
                
                let details = `van "${oldValue}" naar "${newValue}"`;

                const getUserNames = (ids: string[]) => (ids || []).map(id => users.find(u => u.id === id)?.name || 'Onbekend').join(', ') || 'niemand';

                if (field === 'assigneeIds') {
                    const oldAssignees = getUserNames(taskToUpdate.assigneeIds);
                    const newAssignees = getUserNames(updates.assigneeIds || []);
                    details = `van ${oldAssignees} naar ${newAssignees}`;
                }

                if (field === 'reviewerId') {
                    const oldReviewer = taskToUpdate.reviewerId ? users.find(u => u.id === taskToUpdate.reviewerId)?.name || 'Onbekend' : 'niemand';
                    const newReviewer = updates.reviewerId ? users.find(u => u.id === updates.reviewerId)?.name || 'Onbekend' : 'niemand';
                    details = `van ${oldReviewer} naar ${newReviewer}`;
                }
                
                newHistory.push(addHistoryEntry(authUser.uid, `Veld '${field}' gewijzigd`, details));
            }
        });
        
        if (updates.assigneeIds) {
             const addedAssignees = updates.assigneeIds.filter(id => !taskToUpdate.assigneeIds.includes(id));
             addedAssignees.forEach(assigneeId => {
                 createNotification(assigneeId, `Je bent toegewezen aan taak: "${taskToUpdate.title}"`, taskId, currentOrganization.id);
             });
        }
        
        if (updates.reviewerId && updates.reviewerId !== taskToUpdate.reviewerId) {
            createNotification(updates.reviewerId, `Je bent gevraagd om een review te doen voor: "${taskToUpdate.title}"`, taskId, currentOrganization.id);
        }

        if (updates.status === 'In Review' && taskToUpdate.creatorId && taskToUpdate.creatorId !== authUser.uid) {
             await createNotification(taskToUpdate.creatorId, `${user?.name} heeft de taak "${taskToUpdate.title}" ter review aangeboden.`, taskId, currentOrganization.id);
        }

        if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
            finalUpdates.completedAt = new Date();
            
            if(taskToUpdate.assigneeIds.length > 0) {
                const points = calculatePoints(taskToUpdate.priority, taskToUpdate.storyPoints);
                taskToUpdate.assigneeIds.forEach(async (assigneeId) => {
                    const userRef = doc(db, 'users', assigneeId);
                    await updateDoc(userRef, { points: increment(points) });
                    toast({
                        title: 'Goed werk!',
                        description: `${users.find(u=>u.id === assigneeId)?.name} heeft ${points} punten verdiend.`,
                    });
                    await checkAndGrantAchievements(assigneeId, 'completed', { ...taskToUpdate, status: 'Voltooid' });
                });
            }

            if (taskToUpdate.recurring) {
                try {
                    const nextDueDate = calculateNextDueDate(taskToUpdate.dueDate, taskToUpdate.recurring);
                    const newTaskData = {
                        ...taskToUpdate,
                        recurring: taskToUpdate.recurring,
                        status: 'Te Doen' as Status,
                        dueDate: nextDueDate,
                        createdAt: new Date(),
                        subtasks: taskToUpdate.subtasks.map(s => ({...s, completed: false })),
                        comments: [],
                        history: [addHistoryEntry(authUser.uid, 'Automatisch aangemaakt', `Herhaling van taak ${taskToUpdate.id}`)],
                        order: Date.now(),
                        thanked: false,
                    };
                    delete (newTaskData as any).id;
                    delete (newTaskData as any).completedAt;
                    delete (newTaskData as any).activeTimerStartedAt;
                    delete (newTaskData as any).timeLogged;

                    const docRef = await addDoc(collection(db, 'tasks'), newTaskData);

                    if (newTaskData.assigneeIds.length > 0) {
                        newTaskData.assigneeIds.forEach(assigneeId => {
                            createNotification(
                                assigneeId,
                                `Nieuwe herhalende taak: "${newTaskData.title}"`,
                                docRef.id,
                                currentOrganization.id
                            );
                        })
                    }
                    
                    toast({
                        title: 'Herhalende Taak',
                        description: `De volgende taak "${newTaskData.title}" is aangemaakt.`,
                    });
                    triggerWebhooks(currentOrganization.id, 'task.created', { ...newTaskData, id: docRef.id });

                } catch (e) {
                    handleError(e, 'aanmaken van herhalende taak');
                }
            }
        }
        
        if (newHistory.length > 0) {
            finalUpdates.history = arrayUnion(...newHistory);
        }

        if (updates.status && updates.status !== taskToUpdate.status) {
            finalUpdates.order = Date.now();
        }

        Object.keys(finalUpdates).forEach(key => {
          if ((finalUpdates as any)[key] === undefined) {
            (finalUpdates as any)[key] = null;
          }
        });
        
        await updateDoc(taskRef, finalUpdates);
        const updatedTask = { ...taskToUpdate, ...finalUpdates };
        triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);


    } catch (e) {
        handleError(e, `bijwerken van taak`);
    }
  };

  const rateTask = async (taskId: string, rating: number) => {
    if (!user || !currentOrganization) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Authorization check
    const canRate = task.creatorId === user.id && !task.assigneeIds.includes(user.id);
    if (!canRate) {
        toast({ title: 'Niet toegestaan', description: 'Alleen de maker van de taak kan een beoordeling geven, tenzij ze de taak zelf hebben uitgevoerd.', variant: 'destructive' });
        return;
    }

    if (task.rating) {
        toast({ title: 'Al beoordeeld', description: 'Deze taak heeft al een beoordeling.', variant: 'destructive' });
        return;
    }

    try {
        const batch = writeBatch(db);
        const taskRef = doc(db, 'tasks', taskId);

        const historyEntry = addHistoryEntry(user.id, 'Taak beoordeeld', `Gaf een beoordeling van ${rating} sterren.`);
        batch.update(taskRef, {
            rating: rating,
            history: arrayUnion(historyEntry)
        });

        const bonusPoints = rating;
        if (task.assigneeIds.length > 0) {
            task.assigneeIds.forEach(assigneeId => {
                const userRef = doc(db, 'users', assigneeId);
                batch.update(userRef, { points: increment(bonusPoints) });
            });
        }
        
        await batch.commit();

        toast({
            title: 'Taak beoordeeld!',
            description: `De toegewezen teamleden hebben ${bonusPoints} bonuspunten ontvangen.`
        });
        const updatedTask = { ...task, rating: rating };
        triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);
    } catch (e) {
        handleError(e, 'beoordelen van taak');
    }
  };

  const reorderTasks = async (tasksToUpdate: {id: string, order: number}[]) => {
      try {
        const batch = writeBatch(db);
        tasksToUpdate.forEach(taskUpdate => {
            const taskRef = doc(db, 'tasks', taskUpdate.id);
            batch.update(taskRef, { order: taskUpdate.order });
        });
        await batch.commit();
      } catch (e) {
        handleError(e, 'herordenen van taken');
      }
  };

  const addComment = async (taskId: string, text: string) => {
    if (!user || !currentOrganization) {
        handleError({ message: 'Je moet ingelogd zijn om te reageren.' }, 'reageren op taak');
        return;
    }
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) throw new Error("Task not found");
        
        const taskData = taskDoc.data() as Task;

        const newComment: Omit<Comment, 'id'> = {
            userId: user.id,
            text,
            createdAt: new Date(),
            readBy: [user.id],
        };
        const historyEntry = addHistoryEntry(user.id, 'Reactie toegevoegd', `"${text.replace(/<[^>]*>?/gm, '')}"`);
        
        await updateDoc(taskRef, {
            comments: arrayUnion({ ...newComment, id: crypto.randomUUID() }),
            history: arrayUnion(historyEntry)
        });
        
        taskData.assigneeIds.forEach(assigneeId => {
          if (assigneeId !== user.id) {
            createNotification(
                assigneeId,
                `${user.name} heeft gereageerd op: "${taskData.title}"`,
                taskId,
                currentOrganization.id
            );
          }
        })
        
        if (taskData.creatorId && taskData.creatorId !== user.id && !taskData.assigneeIds.includes(taskData.creatorId)) {
             await createNotification(
                taskData.creatorId,
                `${user.name} heeft gereageerd op: "${taskData.title}"`,
                taskId,
                currentOrganization.id
            );
        }
        
        const updatedTask = { ...taskData, id: taskId, comments: [...taskData.comments, newComment] };
        triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);


    } catch (e) {
        handleError(e, 'reageren op taak');
    }
  };

  const markCommentAsRead = async (taskId: string, commentId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const comment = task.comments.find(c => c.id === commentId);
    if (!comment || comment.readBy?.includes(user.id)) return;

    const updatedComments = task.comments.map(c => 
        c.id === commentId
            ? { ...c, readBy: [...(c.readBy || []), user.id] }
            : c
    );

    const taskRef = doc(db, 'tasks', taskId);
    try {
        await updateDoc(taskRef, { comments: updatedComments });
        // No toast, this is a background action.
    } catch(e) {
        handleError(e, 'bijwerken van leesbevestiging');
    }
  };

  const thankForTask = async (taskId: string) => {
    if (!user || !currentOrganization) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.assigneeIds.length === 0 || task.thanked) return;

    try {
        const batch = writeBatch(db);
        
        // Add points to assignees
        const points = 5; // Bonus points for being thanked
        task.assigneeIds.forEach(assigneeId => {
          const assigneeRef = doc(db, 'users', assigneeId);
          batch.update(assigneeRef, { points: increment(points) });
        });
        
        // Mark task as thanked and add history
        const assigneesNames = task.assigneeIds.map(id => users.find(u => u.id === id)?.name || 'Onbekend').join(', ');
        const historyEntry = addHistoryEntry(user.id, 'Bedankje gegeven', `aan ${assigneesNames}`);
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, { 
            thanked: true,
            history: arrayUnion(historyEntry)
        });

        await batch.commit();

        task.assigneeIds.forEach(assigneeId => {
            checkAndGrantAchievements(assigneeId, 'thanked');
        });
        
        toast({
            title: 'Bedankt!',
            description: `${assigneesNames} heeft ${points} bonuspunten ontvangen.`,
        });

        const updatedTask = { ...task, thanked: true };
        triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);

    } catch (e) {
        handleError(e, 'bedanken voor taak');
    }
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => {
    if(taskIds.length === 0 || !authUser || !currentOrganization) return;
    try {
        const batch = writeBatch(db);
        let finalUpdates: Partial<Task> = { ...updates };
        
        const updatePromises = taskIds.map(async (taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            if (updates.assigneeIds) {
                updates.assigneeIds.forEach(assigneeId => {
                    if (!task.assigneeIds.includes(assigneeId)) {
                        createNotification(
                            assigneeId,
                            `Je bent toegewezen aan taak: "${task.title}"`,
                            taskId,
                            currentOrganization.id
                        );
                    }
                });
            }
             if (updates.status === 'Voltooid' && task.status !== 'Voltooid' && task.assigneeIds.length > 0) {
                const points = calculatePoints(task.priority, task.storyPoints);
                task.assigneeIds.forEach(assigneeId => {
                    const userRef = doc(db, 'users', assigneeId);
                    batch.update(userRef, { points: increment(points) });
                    checkAndGrantAchievements(assigneeId, 'completed', {...task, status: 'Voltooid'});
                })
            }
        });

        await Promise.all(updatePromises);
       
        if (updates.status === 'Voltooid') {
            finalUpdates.completedAt = new Date();
        }
        
        const cleanUpdates = { ...finalUpdates };
        Object.keys(cleanUpdates).forEach(key => {
            if ((cleanUpdates as any)[key] === undefined) {
                (cleanUpdates as any)[key] = null;
            }
        });

        const historyEntry = addHistoryEntry(authUser.id, `Bulk-update uitgevoerd op ${taskIds.length} taken.`);

        taskIds.forEach(id => {
            const taskRef = doc(db, 'tasks', id);
            batch.update(taskRef, cleanUpdates);
            batch.update(taskRef, { history: arrayUnion(historyEntry) });
            const updatedTask = { ...tasks.find(t => t.id === id), ...cleanUpdates };
            triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);
        });

        await batch.commit();
        toast({
            title: 'Bulk actie succesvol!',
            description: `${taskIds.length} taken zijn bijgewerkt.`
        });
        setSelectedTaskIds([]);
    } catch (e) {
        handleError(e, 'bulk-update');
    }
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!authUser || !currentOrganization) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);

        if (taskToUpdate) {
            const subtaskText = taskToUpdate.subtasks.find(s => s.id === subtaskId)?.text;
            const isCompleted = !taskToUpdate.subtasks.find(s => s.id === subtaskId)?.completed;

            const updatedSubtasks = taskToUpdate.subtasks.map(subtask =>
                subtask.id === subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
            );
            
            const historyEntry = addHistoryEntry(authUser.uid, 'Subtaak bijgewerkt', `"${subtaskText}" gemarkeerd als ${isCompleted ? 'voltooid' : 'open'}`);
            await updateDoc(taskRef, { 
                subtasks: updatedSubtasks,
                history: arrayUnion(historyEntry)
             });
            const updatedTask = { ...taskToUpdate, subtasks: updatedSubtasks };
            triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);
        }
    } catch (e) {
        handleError(e, 'bijwerken van subtaak');
    }
  };

  const toggleTaskTimer = async (taskId: string) => {
    if (!authUser || !currentOrganization) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const taskRef = doc(db, "tasks", taskId);
    try {
      if (task.activeTimerStartedAt) {
        // Timer is running, so stop it
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - task.activeTimerStartedAt.getTime()) / 1000);
        const newTimeLogged = (task.timeLogged || 0) + elapsed;
        await updateDoc(taskRef, {
          timeLogged: newTimeLogged,
          activeTimerStartedAt: null,
          history: arrayUnion(addHistoryEntry(authUser.uid, 'Tijdregistratie gestopt', `Totaal gelogd: ${newTimeLogged}s`))
        });
        triggerWebhooks(currentOrganization.id, 'task.updated', {...task, timeLogged: newTimeLogged, activeTimerStartedAt: null});
      } else {
        // Timer is stopped, so start it
        await updateDoc(taskRef, {
          activeTimerStartedAt: new Date(),
          history: arrayUnion(addHistoryEntry(authUser.uid, 'Tijdregistratie gestart'))
        });
        triggerWebhooks(currentOrganization.id, 'task.updated', {...task, activeTimerStartedAt: new Date()});
      }
    } catch (e) {
      handleError(e, "tijdregistratie bijwerken");
    }
  };

  const addTemplate = async (templateData: TaskTemplateFormValues) => {
    if (!authUser || !currentOrganization) throw new Error("Niet geautoriseerd of geen organisatie geselecteerd.");
    const newTemplate = {
      ...templateData,
      organizationId: currentOrganization.id,
      creatorId: authUser.uid,
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'taskTemplates'), newTemplate);
  };

  const updateTemplate = async (templateId: string, templateData: TaskTemplateFormValues) => {
    if (!authUser || !currentOrganization) throw new Error("Niet geautoriseerd of geen organisatie geselecteerd.");
    const templateRef = doc(db, 'taskTemplates', templateId);
    await updateDoc(templateRef, templateData);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!authUser || !currentOrganization) throw new Error("Niet geautoriseerd of geen organisatie geselecteerd.");
    const templateRef = doc(db, 'taskTemplates', templateId);
    await deleteDoc(templateRef);
  };

  const resetSubtasks = async (taskId: string) => {
    if (!authUser || !currentOrganization) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);

        if (!taskToUpdate || !taskToUpdate.subtasks || taskToUpdate.subtasks.length === 0) {
            toast({ title: 'Geen subtaken om te resetten.', variant: 'destructive' });
            return;
        }

        const resetSubtasks = taskToUpdate.subtasks.map(subtask => ({ ...subtask, completed: false }));
        
        const historyEntry = addHistoryEntry(authUser.uid, 'Alle subtaken gereset');
        await updateDoc(taskRef, { 
            subtasks: resetSubtasks,
            history: arrayUnion(historyEntry)
        });
        
        const updatedTask = { ...taskToUpdate, subtasks: resetSubtasks };
        triggerWebhooks(currentOrganization.id, 'task.updated', updatedTask);

        toast({
            title: 'Subtaken gereset!',
            description: `Alle subtaken voor "${taskToUpdate.title}" zijn gereset.`,
        });

    } catch (e) {
        handleError(e, 'resetten van subtaken');
    }
  };

  const setChoreOfTheWeek = async (taskId: string) => {
    if (!authUser || !currentOrganization) return;
    try {
        const batch = writeBatch(db);
        
        // Find and unset the current chore of the week
        const currentChore = tasks.find(t => t.isChoreOfTheWeek);
        if (currentChore) {
            const oldChoreRef = doc(db, 'tasks', currentChore.id);
            batch.update(oldChoreRef, { isChoreOfTheWeek: false });
            triggerWebhooks(currentOrganization.id, 'task.updated', {...currentChore, isChoreOfTheWeek: false });
        }

        // Set the new chore of the week
        const newChoreRef = doc(db, 'tasks', taskId);
        batch.update(newChoreRef, { isChoreOfTheWeek: true });

        await batch.commit();
        toast({ title: 'Klus van de Week ingesteld!' });
        const newChoreTask = tasks.find(t => t.id === taskId);
        if(newChoreTask) {
             triggerWebhooks(currentOrganization.id, 'task.updated', {...newChoreTask, isChoreOfTheWeek: true });
        }
    } catch (e) {
        handleError(e, 'instellen van Klus van de Week');
    }
  };

  const addPersonalGoal = async (goalData: PersonalGoalFormValues): Promise<boolean> => {
    if (!authUser || !currentOrganization) return false;
    try {
      const newGoal: Omit<PersonalGoal, 'id'> = {
        userId: authUser.uid,
        organizationId: currentOrganization.id,
        title: goalData.title,
        description: goalData.description || '',
        targetDate: goalData.targetDate || undefined,
        status: 'In Progress',
        milestones: goalData.milestones?.map(m => ({...m, id: crypto.randomUUID(), completed: false})) || [],
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'personalGoals'), newGoal);
      toast({ title: 'Doel Aangemaakt!', description: `Je nieuwe doel "${goalData.title}" is opgeslagen.` });
      return true;
    } catch(e) {
      handleError(e, 'opslaan van persoonlijk doel');
      return false;
    }
  };

  const updatePersonalGoal = async (goalId: string, goalData: PersonalGoalFormValues): Promise<boolean> => {
    try {
      const goalRef = doc(db, 'personalGoals', goalId);
      const existingGoal = personalGoals.find(g => g.id === goalId);
      if (!existingGoal) return false;

      const updatedMilestones = goalData.milestones?.map((ms, index) => {
          const existingMilestone = existingGoal.milestones.find(ems => ems.text === ms.text);
          return {
              id: existingMilestone?.id || existingGoal.milestones[index]?.id || crypto.randomUUID(),
              text: ms.text,
              completed: existingMilestone?.completed || existingGoal.milestones[index]?.completed || false
          }
      }) || [];

      const cleanGoalData = {
          title: goalData.title,
          description: goalData.description,
          targetDate: goalData.targetDate,
          milestones: updatedMilestones
      }

      await updateDoc(goalRef, cleanGoalData);
      toast({ title: 'Doel Bijgewerkt!' });
      return true;
    } catch(e) {
      handleError(e, 'bijwerken van persoonlijk doel');
      return false;
    }
  };

  const deletePersonalGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, 'personalGoals', goalId));
      toast({ title: 'Doel Verwijderd' });
    } catch(e) {
      handleError(e, 'verwijderen van persoonlijk doel');
    }
  };
  
  const toggleMilestoneCompletion = async (goalId: string, milestoneId: string) => {
    try {
      const goal = personalGoals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      
      const allCompleted = updatedMilestones.every(m => m.completed);
      
      const goalRef = doc(db, 'personalGoals', goalId);
      await updateDoc(goalRef, {
        milestones: updatedMilestones,
        status: allCompleted ? 'Achieved' : 'In Progress'
      });
      
      if (allCompleted) {
        toast({ title: 'Doel Behaald!', description: `Gefeliciteerd met het behalen van je doel: "${goal.title}"` });
      }

    } catch (e) {
      handleError(e, 'bijwerken van mijlpaal');
    }
  };

  const addIdea = async (ideaData: IdeaFormValues): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    const result = await createIdeaAction(currentOrganization.id, user.id, ideaData);
    if (result.error) {
      handleError({ message: result.error }, 'indienen van idee');
      return false;
    }
    toast({ title: 'Idee ingediend!', description: 'Bedankt voor je bijdrage.' });
    return true;
  };

  const toggleIdeaUpvote = async (ideaId: string) => {
    if (!user) return;
    const result = await toggleIdeaUpvoteAction(ideaId, user.id);
    if (result.error) {
      handleError({ message: result.error }, 'stemmen op idee');
    }
  };

  const updateIdeaStatus = async (ideaId: string, status: IdeaStatus) => {
    if (!user || !currentOrganization) return;
    const result = await updateIdeaStatusAction(ideaId, status, user.id, currentOrganization.id);
    if (result.error) {
      handleError({ message: result.error }, 'bijwerken van idee status');
    } else {
      toast({ title: 'Status bijgewerkt!' });
    }
  };

  const addTeamChallenge = async (challengeData: TeamChallengeFormValues): Promise<boolean> => {
    if (!authUser || !currentOrganization) return false;
    try {
      const newChallenge: Omit<TeamChallenge, 'id' | 'createdAt' | 'status'> = {
        organizationId: currentOrganization.id,
        ...challengeData,
      };
      await addDoc(collection(db, 'teamChallenges'), {
          ...newChallenge,
          status: 'active',
          createdAt: new Date(),
      });
      toast({ title: 'Uitdaging Aangemaakt!', description: `De uitdaging "${challengeData.title}" is gestart.` });
      return true;
    } catch(e) {
      handleError(e, 'opslaan van team uitdaging');
      return false;
    }
  };

  const updateTeamChallenge = async (challengeId: string, challengeData: TeamChallengeFormValues): Promise<boolean> => {
    try {
      const challengeRef = doc(db, 'teamChallenges', challengeId);
      await updateDoc(challengeRef, challengeData as any); // cast to any to avoid type issues with firestore
      toast({ title: 'Uitdaging Bijgewerkt!' });
      return true;
    } catch(e) {
      handleError(e, 'bijwerken van team uitdaging');
      return false;
    }
  };

  const deleteTeamChallenge = async (challengeId: string) => {
    try {
      await deleteDoc(doc(db, 'teamChallenges', challengeId));
      toast({ title: 'Uitdaging Verwijderd' });
    } catch(e) {
      handleError(e, 'verwijderen van team uitdaging');
    }
  };

  const completeTeamChallenge = async (challengeId: string) => {
    if (!currentOrganization) return;
    const challenge = teamChallenges.find(c => c.id === challengeId);
    const { teams } = useAuth();
    const team = teams.find(t => t.id === challenge?.teamId);

    if (!challenge || !team || team.memberIds.length === 0) {
        handleError({ message: 'Uitdaging of team niet gevonden of team is leeg.'}, 'uitdaging voltooien');
        return;
    }
    
    try {
        const batch = writeBatch(db);
        const rewardPerMember = Math.floor(challenge.reward / team.memberIds.length);

        team.memberIds.forEach(memberId => {
            const userRef = doc(db, 'users', memberId);
            batch.update(userRef, { points: increment(rewardPerMember) });
        });

        const challengeRef = doc(db, 'teamChallenges', challengeId);
        batch.update(challengeRef, { status: 'completed', completedAt: new Date() });
        
        await batch.commit();
        toast({ title: 'Uitdaging Voltooid!', description: `Team ${team.name} heeft ${challenge.reward} punten verdiend!` });

    } catch (e) {
        handleError(e, 'voltooien van uitdaging');
    }
  };

  const toggleMuteTask = async (taskId: string) => {
    if (!user) return;
    try {
        const result = await toggleMuteTaskAction(user.id, taskId);
        if (result.error) {
            handleError({ message: result.error }, 'dempen van taak');
        } else {
            toast({ title: `Taak ${result.newState === 'muted' ? 'gedempt' : 'niet langer gedempt'}` });
            await refreshUser();
        }
    } catch (e) {
        handleError(e, 'dempen van taak');
    }
  };


  return (
    <TaskContext.Provider value={{ 
      tasks,
      users,
      templates,
      loading,
      addTask, 
      updateTask, 
      rateTask,
      toggleSubtaskCompletion,
      toggleTaskTimer,
      reorderTasks,
      resetSubtasks,
      addComment,
      markCommentAsRead,
      thankForTask,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      setChoreOfTheWeek,
      searchTerm, 
      setSearchTerm,
      selectedTaskIds,
      setSelectedTaskIds,
      toggleTaskSelection,
      bulkUpdateTasks,
      cloneTask,
      splitTask,
      deleteTaskPermanently,
      filters,
      setFilters,
      clearFilters,
      activeFilterCount,
      notifications,
      markAllNotificationsAsRead,
      markSingleNotificationAsRead,
      archiveNotification,
      snoozeNotification,
      viewedUser,
      setViewedUser,
      isAddTaskDialogOpen,
      setIsAddTaskDialogOpen,
      personalGoals,
      addPersonalGoal,
      updatePersonalGoal,
      deletePersonalGoal,
      toggleMilestoneCompletion,
      ideas,
      addIdea,
      toggleIdeaUpvote,
      updateIdeaStatus,
      teamChallenges,
      addTeamChallenge,
      updateTeamChallenge,
      deleteTeamChallenge,
      completeTeamChallenge,
      toggleMuteTask,
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
