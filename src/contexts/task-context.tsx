
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
import { addDays, addHours, addMonths, addWeeks, isBefore, startOfMonth, getDay, setDate } from 'date-fns';
import type { Task, TaskFormValues, User, Status, Label, Filters, Notification, Comment, HistoryEntry, Recurring, TaskTemplate, TaskTemplateFormValues } from '@/lib/types';
import { ACHIEVEMENTS } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
import { calculatePoints } from '@/lib/utils';

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
  deleteTaskPermanently: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  toggleTaskTimer: (taskId: string) => void;
  reorderTasks: (tasksToUpdate: {id: string, order: number}[]) => void;
  addComment: (taskId: string, text: string) => void;
  thankForTask: (taskId: string) => Promise<void>;
  addTemplate: (templateData: TaskTemplateFormValues) => Promise<void>;
  updateTemplate: (templateId: string, templateData: TaskTemplateFormValues) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleTaskSelection: (taskId: string) => void;
  filters: Filters;
  setFilters: (newFilters: Partial<Filters>) => void;
  clearFilters: () => void;
  notifications: Notification[];
  markNotificationsAsRead: () => void;
  snoozeNotification: (notificationId: string) => void;
  viewedUser: User | null;
  setViewedUser: (user: User | null) => void;
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (open: boolean) => void;
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
  const { authUser, user, currentOrganization } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filters, setRawFilters] = useState<Filters>({ assigneeId: null, labels: [], priority: null, teamId: null });
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const setFilters = (newFilters: Partial<Filters>) => {
    setRawFilters(prev => ({...prev, ...newFilters}));
  };

  const clearFilters = () => {
      setRawFilters({ assigneeId: null, labels: [], priority: null, teamId: null });
      setSearchTerm('');
  };

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
    if (!currentOrganization) {
      setTasks([]);
      setUsers([]);
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const qTasks = query(collection(db, 'tasks'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'Te Doen',
          priority: data.priority || 'Midden',
          assigneeIds: data.assigneeIds || [],
          creatorId: data.creatorId || null,
          teamId: data.teamId || null,
          labels: data.labels || [],
          subtasks: data.subtasks || [],
          attachments: data.attachments || [],
          comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: (c.createdAt as Timestamp)?.toDate() })),
          history: (data.history || []).map((h: any) => ({ ...h, timestamp: (h.timestamp as Timestamp)?.toDate() })),
          isPrivate: data.isPrivate || false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          dueDate: (data.dueDate as Timestamp)?.toDate(),
          completedAt: (data.completedAt as Timestamp)?.toDate(),
          order: data.order || 0,
          storyPoints: data.storyPoints,
          blockedBy: data.blockedBy || [],
          recurring: data.recurring,
          organizationId: data.organizationId,
          imageDataUri: data.imageDataUri,
          thanked: data.thanked || false,
          timeLogged: data.timeLogged || 0,
          activeTimerStartedAt: (data.activeTimerStartedAt as Timestamp)?.toDate(),
          rating: data.rating || null,
        } as Task;
      }).filter(task => {
        if (!authUser) return false;
        if (task.isPrivate && !task.assigneeIds.includes(authUser.uid) && task.creatorId !== authUser.uid) {
            return false;
        }
        return true;
      });
      setTasks(tasksData);
      setLoading(false);
    }, (error: FirestoreError) => handleError(error, 'laden van taken'));

    const qUsers = query(collection(db, 'users'), where("organizationIds", "array-contains", currentOrganization.id));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setUsers(usersData);
    }, (error: FirestoreError) => handleError(error, 'laden van gebruikers'));

    const qTemplates = query(collection(db, 'taskTemplates'), where("organizationId", "==", currentOrganization.id));
    const unsubscribeTemplates = onSnapshot(qTemplates, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        } as TaskTemplate));
        setTemplates(templatesData);
    }, (error: FirestoreError) => handleError(error, 'laden van templates'));


    return () => {
        unsubscribeTasks();
        unsubscribeUsers();
        unsubscribeTemplates();
    };
  }, [authUser, currentOrganization, toast]);


  useEffect(() => {
    if (!db || !authUser) return;
    
    const q = query(collection(db, "notifications"), where("userId", "==", authUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                snoozedUntil: (data.snoozedUntil as Timestamp)?.toDate(),
            } as Notification;
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(notificationsData);
    }, (error: FirestoreError) => handleError(error, 'laden van notificaties'));

    return () => unsubscribe();
  }, [authUser, toast]);


  const createNotification = async (userId: string, message: string, taskId: string) => {
      if (!authUser || userId === authUser.uid) return;
      try {
          await addDoc(collection(db, 'notifications'), {
              userId,
              message,
              taskId,
              read: false,
              createdAt: new Date(),
          });
      } catch (e) {
          handleError(e, 'maken van notificatie');
      }
  };
  
  const markNotificationsAsRead = async () => {
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
          teamId: taskData.teamId || null,
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 'Midden',
          isPrivate: taskData.isPrivate || false,
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
          recurring: taskData.recurring ?? null,
          organizationId: currentOrganization.id,
          imageDataUri: taskData.imageDataUri ?? null,
          thanked: false,
          timeLogged: 0,
          activeTimerStartedAt: null,
          completedAt: null,
          rating: null,
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        if (firestoreTask.assigneeIds.length > 0) {
            firestoreTask.assigneeIds.forEach(assigneeId => {
              createNotification(
                  assigneeId,
                  `${user?.name} heeft je toegewezen aan: "${firestoreTask.title}"`,
                  docRef.id
              );
            });
        }
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
        };
        
        delete (clonedTask as any).id; 

        await addDoc(collection(db, 'tasks'), clonedTask);
        toast({
            title: 'Taak Gekloond!',
            description: `Een kopie van "${taskToClone.title}" is aangemaakt.`,
        });
    } catch (e) {
        handleError(e, 'klonen van taak');
    }
  }

  const deleteTaskPermanently = async (taskId: string) => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);
        toast({
            title: 'Taak Permanent Verwijderd',
            variant: 'destructive',
        });
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
    if (!authUser) return;
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        
        const finalUpdates: { [key: string]: any } = { ...updates };
        const newHistory: HistoryEntry[] = [];

        const fieldsToTrack: (keyof Task)[] = ['status', 'assigneeIds', 'priority', 'dueDate', 'title', 'teamId'];
        fieldsToTrack.forEach(field => {
            if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(taskToUpdate[field])) {
                const oldValue = field === 'dueDate' ? (taskToUpdate[field] ? (taskToUpdate[field] as Date).toLocaleDateString() : 'geen') : (taskToUpdate[field] || 'leeg');
                const newValue = field === 'dueDate' ? (updates[field] ? (updates[field] as Date).toLocaleDateString() : 'geen') : (updates[field] || 'leeg');
                
                let details = `van "${oldValue}" naar "${newValue}"`;
                if (field === 'assigneeIds') {
                    const oldAssignees = taskToUpdate.assigneeIds.map(id => users.find(u => u.id === id)?.name || 'Onbekend').join(', ') || 'niemand';
                    const newAssignees = (updates.assigneeIds || []).map(id => users.find(u => u.id === id)?.name || 'Onbekend').join(', ') || 'niemand';
                    details = `van ${oldAssignees} naar ${newAssignees}`;
                }
                newHistory.push(addHistoryEntry(authUser.uid, `Veld '${field}' gewijzigd`, details));
            }
        });
        
        if (updates.assigneeIds) {
             const addedAssignees = updates.assigneeIds.filter(id => !taskToUpdate.assigneeIds.includes(id));
             addedAssignees.forEach(assigneeId => {
                 createNotification(assigneeId, `Je bent toegewezen aan taak: "${taskToUpdate.title}"`, taskId);
             });
        }

        if (updates.status === 'In Review' && taskToUpdate.creatorId && taskToUpdate.creatorId !== authUser.uid) {
             await createNotification(taskToUpdate.creatorId, `${user?.name} heeft de taak "${taskToUpdate.title}" ter review aangeboden.`, taskId);
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
                                docRef.id
                            );
                        })
                    }
                    
                    toast({
                        title: 'Herhalende Taak',
                        description: `De volgende taak "${newTaskData.title}" is aangemaakt.`,
                    });

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
          if (finalUpdates[key] === undefined) {
            finalUpdates[key] = null;
          }
        });
        
        await updateDoc(taskRef, finalUpdates);

    } catch (e) {
        handleError(e, `bijwerken van taak`);
    }
  };

  const rateTask = async (taskId: string, rating: number) => {
    if (!user) return;
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
    if (!user) {
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
                taskId
            );
          }
        })
        
        if (taskData.creatorId && taskData.creatorId !== user.id && !taskData.assigneeIds.includes(taskData.creatorId)) {
             await createNotification(
                taskData.creatorId,
                `${user.name} heeft gereageerd op: "${taskData.title}"`,
                taskId
            );
        }

    } catch (e) {
        handleError(e, 'reageren op taak');
    }
  };

  const thankForTask = async (taskId: string) => {
    if (!user) return;
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

    } catch (e) {
        handleError(e, 'bedanken voor taak');
    }
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => {
    if(taskIds.length === 0 || !authUser) return;
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
                            taskId
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
  }

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    if (!authUser) return;
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
        }
    } catch (e) {
        handleError(e, 'bijwerken van subtaak');
    }
  };

  const toggleTaskTimer = async (taskId: string) => {
    if (!authUser) return;
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
      } else {
        // Timer is stopped, so start it
        await updateDoc(taskRef, {
          activeTimerStartedAt: new Date(),
          history: arrayUnion(addHistoryEntry(authUser.uid, 'Tijdregistratie gestart'))
        });
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
      addComment,
      thankForTask,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      searchTerm, 
      setSearchTerm,
      selectedTaskIds,
      setSelectedTaskIds,
      toggleTaskSelection,
      bulkUpdateTasks,
      cloneTask,
      deleteTaskPermanently,
      filters,
      setFilters,
      clearFilters,
      notifications,
      markNotificationsAsRead,
      snoozeNotification,
      viewedUser,
      setViewedUser,
      isAddTaskDialogOpen,
      setIsAddTaskDialogOpen
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
