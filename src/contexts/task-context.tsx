'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Task, Priority, TaskFormValues, User } from '@/lib/types';
import { TASKS, USERS } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

type TaskContextType = {
  tasks: Task[];
  users: User[];
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => void;
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
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [users, setUsers] = useState<User[]>(USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const addTask = (taskData: Partial<TaskFormValues> & { title: string }) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || '',
      assigneeId: taskData.assigneeId || null,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'Midden',
      isPrivate: taskData.isPrivate || false,
      labels: (taskData.labels as Task['labels']) || [],
      status: 'Te Doen',
      createdAt: new Date(),
      subtasks: taskData.subtasks?.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) || [],
      attachments: taskData.attachments?.map(at => ({ id: crypto.randomUUID(), url: at.url, name: at.url, type: 'file' })) || [],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };
  
  const cloneTask = (taskId: string) => {
    const taskToClone = tasks.find(t => t.id === taskId);
    if (!taskToClone) return;

    const clonedTask: Task = {
      ...taskToClone,
      id: crypto.randomUUID(),
      title: `[KLONE] ${taskToClone.title}`,
      status: 'Te Doen',
      createdAt: new Date(),
      completedAt: undefined,
    };
    setTasks(prevTasks => [...prevTasks, clonedTask]);
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    let finalUpdates = { ...updates };

    if (updates.status === 'Voltooid' && taskToUpdate.status !== 'Voltooid') {
        const points = calculatePoints(taskToUpdate.priority);
        finalUpdates.completedAt = new Date();

        if (taskToUpdate.assigneeId) {
            let assigneeName = '';
            setUsers(prevUsers => prevUsers.map(user => {
                if (user.id === taskToUpdate.assigneeId) {
                    assigneeName = user.name;
                    return { ...user, points: user.points + points };
                }
                return user;
            }));
            
            if (assigneeName) {
                toast({
                    title: 'Goed werk!',
                    description: `${assigneeName} heeft ${points} punten verdiend voor het voltooien van een taak.`,
                });
            }
        }
    }

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...finalUpdates } : task
      )
    );
  };

  const bulkUpdateTasks = (taskIds: string[], updates: Partial<Omit<Task, 'id'>>) => {
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
             setUsers(prevUsers => prevUsers.map(user => {
                if (pointUpdates.has(user.id)) {
                    return { ...user, points: user.points + (pointUpdates.get(user.id) || 0) };
                }
                return user;
            }));
        }

        if(completedCount > 0) {
            toast({
                title: 'Taken Voltooid!',
                description: `${completedCount} taken voltooid en punten toegekend.`
            });
        }
        finalUpdates.completedAt = new Date();
    }
    
    setTasks(prev => 
      prev.map(task => 
        taskIds.includes(task.id) ? { ...task, ...finalUpdates } : task
      )
    );
    setSelectedTaskIds([]);
  }

  const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === subtaskId
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
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
