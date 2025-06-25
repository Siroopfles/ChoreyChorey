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
import type { Task, Priority, TaskFormValues, User, Status, Label, Filters, Notification, Comment, HistoryEntry } from '@/lib/types';
import { ACHIEVEMENTS } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
import { calculatePoints } from '@/lib/utils';

type TaskContextType = {
  tasks: Task[];
  users: User[];
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments'>>) => void;
  cloneTask: (taskId: string) => void;
  deleteTaskPermanently: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  reorderTasks: (tasksToUpdate: {id: string, order: number}[]) => void;
  addComment: (taskId: string, text: string) => void;
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
  viewedUser: User | null;
  setViewedUser: (user: User | null) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { authUser, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filters, setRawFilters] = useState<Filters>({ assigneeId: null, labels: [], priority: null });
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const setFilters = (newFilters: Partial<Filters>) => {
    setRawFilters(prev => ({...prev, ...newFilters}));
  };

  const clearFilters = () => {
      setRawFilters({ assigneeId: null, labels: [], priority: null });
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
    return {
        id: crypto.randomUUID(),
        userId: userId || 'system',
        timestamp: new Date(),
        action,
        details,
    };
  };

  useEffect(() => {
    if (!db || !authUser) return;
    
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'Te Doen',
          priority: data.priority || 'Midden',
          assigneeId: data.assigneeId || null,
          creatorId: data.creatorId || null,
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
        } as Task;
      }).filter(task => {
        if (task.isPrivate && task.assigneeId !== authUser.uid && task.creatorId !== authUser.uid) {
            return false;
        }
        return true;
      });
      setTasks(tasksData);
    }, (error: FirestoreError) => handleError(error, 'laden van taken'));

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setUsers(usersData);
    }, (error: FirestoreError) => handleError(error, 'laden van gebruikers'));

    return () => {
        unsubscribeTasks();
        unsubscribeUsers();
    };
  }, [authUser, toast]);

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
            } as Notification;
        }).sort((a, b) => b.createdAt.getTime() - b.createdAt.getTime());
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

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }) => {
    if (!authUser) return;
    try {
        const history = [addHistoryEntry(authUser.uid, 'Aangemaakt')];
        const firestoreTask = {
          title: taskData.title,
          description: taskData.description || '',
          assigneeId: taskData.assigneeId || null,
          creatorId: authUser.uid,
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 'Midden',
          isPrivate: taskData.isPrivate || false,
          labels: (taskData.labels as Label[]) || [],
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
          attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.url, type: 'file' as const })) || [],
          comments: [],
          history: history,
          order: Date.now(),
          storyPoints: taskData.storyPoints || null,
          blockedBy: taskData.blockedBy || [],
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        if (firestoreTask.assigneeId) {
            await createNotification(
                firestoreTask.assigneeId,
                `${user?.name} heeft je toegewezen aan: "${firestoreTask.title}"`,
                docRef.id
            );
        }
    } catch (e) {
        handleError(e, 'opslaan van taak');
    }
  };
  
  const cloneTask = async (taskId: string) => {
    if (!authUser) return;
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

  const checkAndGrantAchievements = useCallback(async (userId: string, completedTask: Task) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as User;
    const userAchievements = userData.achievements || [];
    const achievementsToGrant = [];

    // Achievement: First Task
    if (!userAchievements.includes(ACHIEVEMENTS.FIRST_TASK.id)) {
        achievementsToGrant.push(ACHIEVEMENTS.FIRST_TASK.id);
        toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.FIRST_TASK.name}" verdiend!` });
    }
    
    // Achievement: Team Player
    if (completedTask.creatorId && completedTask.creatorId !== userId && !userAchievements.includes(ACHIEVEMENTS.COMMUNITY_HELPER.id)) {
        achievementsToGrant.push(ACHIEVEMENTS.COMMUNITY_HELPER.id);
        toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.COMMUNITY_HELPER.name}" verdiend!` });
    }

    // Achievement: 10 Tasks
    const completedTasksQuery = query(collection(db, 'tasks'), where('assigneeId', '==', userId), where('status', '==', 'Voltooid'));
    const completedTasksSnapshot = await getDocs(completedTasksQuery);
    if (completedTasksSnapshot.size >= 10 && !userAchievements.includes(ACHIEVEMENTS.TEN_TASKS.id)) {
        achievementsToGrant.push(ACHIEVEMENTS.TEN_TASKS.id);
        toast({ title: 'Prestatie ontgrendeld!', description: `Je hebt de prestatie "${ACHIEVEMENTS.TEN_TASKS.name}" verdiend!` });
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

        if (updates.status && updates.status !== taskToUpdate.status) {
            newHistory.push(addHistoryEntry(authUser.uid, 'Status gewijzigd', `van "${taskToUpdate.status}" naar "${updates.status}"`));
            if (updates.status === 'In Review' && taskToUpdate.creatorId && taskToUpdate.creatorId !== authUser.uid) {
                await createNotification(taskToUpdate.creatorId, `${user?.name} heeft de taak "${taskToUpdate.title}" ter review aangeboden.`, taskId);
            }
        }
        if (updates.assigneeId && updates.assigneeId !== taskToUpdate.assigneeId) {
            const assigneeName = users.find(u => u.id === updates.assigneeId)?.name || 'onbekend';
             await createNotification(updates.assigneeId, `Je bent toegewezen aan taak: "${taskToUpdate.title}"`, taskId);
             newHistory.push(addHistoryEntry(authUser.uid, 'Toegewezen aan', assigneeName));
        }

        if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
            finalUpdates.completedAt = new Date();
            
            if(taskToUpdate.assigneeId) {
                const points = calculatePoints(taskToUpdate.priority);
                const assignee = users.find(u => u.id === taskToUpdate.assigneeId);
                if(assignee) {
                    const userRef = doc(db, 'users', assignee.id);
                    await updateDoc(userRef, { points: increment(points) });
                    toast({
                        title: 'Goed werk!',
                        description: `${assignee.name} heeft ${points} punten verdiend voor het voltooien van een taak.`,
                    });
                    
                    await checkAndGrantAchievements(assignee.id, taskToUpdate);
                }
            }
        }
        
        if (newHistory.length > 0) {
            finalUpdates.history = arrayUnion(...newHistory);
        }

        Object.keys(finalUpdates).forEach(key => {
          if (finalUpdates[key] === undefined) {
            finalUpdates[key] = null;
          }
        });
        
        if (finalUpdates.history === undefined) delete finalUpdates.history;

        await updateDoc(taskRef, finalUpdates);
        
        if(finalUpdates.history) {
            await updateDoc(taskRef, { history: finalUpdates.history });
        }

    } catch (e) {
        handleError(e, `bijwerken van taak`);
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
        await updateDoc(taskRef, {
            comments: arrayUnion({ ...newComment, id: crypto.randomUUID() })
        });
        
        if (taskData.assigneeId && taskData.assigneeId !== user.id) {
            await createNotification(
                taskData.assigneeId,
                `${user.name} heeft gereageerd op: "${taskData.title}"`,
                taskId
            );
        }

    } catch (e) {
        handleError(e, 'reageren op taak');
    }
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => {
    if(taskIds.length === 0) return;
    try {
        const batch = writeBatch(db);
        let finalUpdates: Partial<Task> = { ...updates };

        if (updates.assigneeId) {
            for (const taskId of taskIds) {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.assigneeId !== updates.assigneeId) {
                    await createNotification(
                        updates.assigneeId!,
                        `Je bent toegewezen aan taak: "${task.title}"`,
                        taskId
                    );
                }
            }
        }

        if (updates.status === 'Voltooid') {
            const pointUpdates = new Map<string, number>();
            let completedCount = 0;

            for(const id of taskIds) {
                const task = tasks.find(t => t.id === id);
                if (task && task.status !== 'Voltooid' && task.assigneeId) {
                    const points = calculatePoints(task.priority);
                    pointUpdates.set(task.assigneeId, (pointUpdates.get(task.assigneeId) || 0) + points);
                    await checkAndGrantAchievements(task.assigneeId, task);
                    completedCount++;
                }
            };
            
            if (pointUpdates.size > 0) {
                pointUpdates.forEach((points, userId) => {
                    const userRef = doc(db, 'users', userId);
                    batch.update(userRef, { points: increment(points) });
                });
            }

            if(completedCount > 0) {
                toast({
                    title: 'Taken Voltooid!',
                    description: `${completedCount} taken voltooid en punten toegekend.`
                });
            }
            finalUpdates.completedAt = new Date();
        }
        
        const cleanUpdates = { ...finalUpdates };
        Object.keys(cleanUpdates).forEach(key => {
            if ((cleanUpdates as any)[key] === undefined) {
                (cleanUpdates as any)[key] = null;
            }
        });

        taskIds.forEach(id => {
            const taskRef = doc(db, 'tasks', id);
            batch.update(taskRef, cleanUpdates);
            const historyEntry = addHistoryEntry(user?.id ?? null, `Bulk-update: ${Object.keys(cleanUpdates).join(', ')}`);
            batch.update(taskRef, { history: arrayUnion(historyEntry) });
        });

        await batch.commit();
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

  return (
    <TaskContext.Provider value={{ 
      tasks,
      users,
      addTask, 
      updateTask, 
      toggleSubtaskCompletion, 
      reorderTasks,
      addComment,
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
      viewedUser,
      setViewedUser
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
