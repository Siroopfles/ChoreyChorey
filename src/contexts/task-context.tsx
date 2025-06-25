'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
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
  orderBy,
} from 'firebase/firestore';
import type { Task, Priority, TaskFormValues, User, Status, Label, Filters, Notification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

type TaskContextType = {
  tasks: Task[];
  users: User[];
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments'>>) => void;
  cloneTask: (taskId: string) => void;
  deleteTaskPermanently: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
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
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const calculatePoints = (priority: Priority): number => {
    switch (priority) {
        case 'Urgent': return 30;
        case 'Hoog': return 20;
        case 'Midden': return 10;
        case 'Laag': return 5;
        default: return 0;
    }
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filters, setRawFilters] = useState<Filters>({ assigneeId: null, labels: [], priority: null });
  const { toast } = useToast();
  
  const currentUser = users.length > 0 ? users[0] : null;

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

  useEffect(() => {
    if (!db) return;
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
          labels: data.labels || [],
          subtasks: data.subtasks || [],
          attachments: data.attachments || [],
          isPrivate: data.isPrivate || false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          dueDate: (data.dueDate as Timestamp)?.toDate(),
          completedAt: (data.completedAt as Timestamp)?.toDate(),
        } as Task;
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
  }, [toast]);

  useEffect(() => {
    if (!db || !currentUser) return;
    
    const q = query(collection(db, "notifications"), where("userId", "==", currentUser.id), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Notification;
        });
        setNotifications(notificationsData);
    }, (error: FirestoreError) => handleError(error, 'laden van notificaties'));

    return () => unsubscribe();
  }, [currentUser, toast]);


  const createNotification = async (userId: string, message: string, taskId: string) => {
      if (!currentUser || userId === currentUser.id) return; // Don't notify self
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
    if (!currentUser) return;
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
    try {
        const firestoreTask = {
          title: taskData.title,
          description: taskData.description || '',
          assigneeId: taskData.assigneeId || null,
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 'Midden',
          isPrivate: taskData.isPrivate || false,
          labels: (taskData.labels as Label[]) || [],
          status: 'Te Doen' as Status,
          createdAt: new Date(),
          subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
          attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.url, type: 'file' as const })) || [],
        };
        const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);

        if (firestoreTask.assigneeId) {
            await createNotification(
                firestoreTask.assigneeId,
                `Je bent toegewezen aan taak: "${firestoreTask.title}"`,
                docRef.id
            );
        }
    } catch (e) {
        handleError(e, 'opslaan van taak');
    }
  };
  
  const cloneTask = async (taskId: string) => {
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
          completedAt: null,
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

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        
        const finalUpdates: { [key: string]: any } = { ...updates };

        if (updates.assigneeId && updates.assigneeId !== taskToUpdate.assigneeId) {
             await createNotification(
                updates.assigneeId,
                `Je bent toegewezen aan taak: "${taskToUpdate.title}"`,
                taskId
            );
        }

        if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
            const points = calculatePoints(taskToUpdate.priority);
            finalUpdates.completedAt = new Date();

            if (taskToUpdate.assigneeId) {
                const assignee = users.find(u => u.id === taskToUpdate.assigneeId);
                if(assignee) {
                    const userRef = doc(db, 'users', assignee.id);
                    await updateDoc(userRef, { points: increment(points) });
                    
                    toast({
                        title: 'Goed werk!',
                        description: `${assignee.name} heeft ${points} punten verdiend voor het voltooien van een taak.`,
                    });
                }
            }
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

            taskIds.forEach(id => {
                const task = tasks.find(t => t.id === id);
                if (task && task.status !== 'Voltooid' && task.assigneeId) {
                    const points = calculatePoints(task.priority);
                    pointUpdates.set(task.assigneeId, (pointUpdates.get(task.assigneeId) || 0) + points);
                    completedCount++;
                }
            });
            
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
        });

        await batch.commit();
        setSelectedTaskIds([]);
    } catch (e) {
        handleError(e, 'bulk-update');
    }
  }

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskToUpdate = tasks.find(t => t.id === taskId);

        if (taskToUpdate) {
            const updatedSubtasks = taskToUpdate.subtasks.map(subtask =>
                subtask.id === subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
            );
            await updateDoc(taskRef, { subtasks: updatedSubtasks });
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
      markNotificationsAsRead
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
