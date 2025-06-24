'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  writeBatch, 
  getDoc,
  increment,
  deleteDoc
} from 'firebase/firestore';
import type { Task, Priority, TaskFormValues, User, Status } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

type TaskContextType = {
  tasks: Task[];
  users: User[];
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id' | 'subtasks' | 'attachments'>>) => void;
  cloneTask: (taskId: string) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleTaskSelection: (taskId: string) => void;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          dueDate: (data.dueDate as Timestamp)?.toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          completedAt: (data.completedAt as Timestamp)?.toDate(),
        } as Task;
      });
      setTasks(tasksData);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setUsers(usersData);
    });

    return () => {
        unsubscribeTasks();
        unsubscribeUsers();
    };
  }, []);


  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const addTask = async (taskData: Partial<TaskFormValues> & { title: string }) => {
    const firestoreTask = {
      title: taskData.title,
      description: taskData.description || '',
      assigneeId: taskData.assigneeId || null,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'Midden',
      isPrivate: taskData.isPrivate || false,
      labels: (taskData.labels as Task['labels']) || [],
      status: 'Te Doen' as Status,
      createdAt: new Date(),
      subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
      attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.url, type: 'file' })) || [],
    };
    await addDoc(collection(db, 'tasks'), firestoreTask);
  };
  
  const cloneTask = async (taskId: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskDocRef);
    if (!taskDoc.exists()) return;

    const taskToClone = taskDoc.data();
    const clonedTask = {
      ...taskToClone,
      title: `[KLONE] ${taskToClone.title}`,
      status: 'Te Doen',
      createdAt: new Date(),
      completedAt: undefined,
    };
    
    // remove id if it exists on data
    delete clonedTask.id; 

    await addDoc(collection(db, 'tasks'), clonedTask);
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const finalUpdates: { [key: string]: any } = { ...updates };

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

    // Sanitize undefined values before sending to Firestore
    if (finalUpdates.hasOwnProperty('dueDate')) {
      finalUpdates.dueDate = finalUpdates.dueDate || null;
    }
    if (finalUpdates.hasOwnProperty('description')) {
      finalUpdates.description = finalUpdates.description || '';
    }
    if (finalUpdates.hasOwnProperty('assigneeId')) {
      finalUpdates.assigneeId = finalUpdates.assigneeId || null;
    }

    await updateDoc(taskRef, finalUpdates);
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => {
    const batch = writeBatch(db);
    let finalUpdates: Partial<Task> = { ...updates };

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
    
    taskIds.forEach(id => {
        const taskRef = doc(db, 'tasks', id);
        batch.update(taskRef, finalUpdates);
    });

    await batch.commit();
    setSelectedTaskIds([]);
  }

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string) => {
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
