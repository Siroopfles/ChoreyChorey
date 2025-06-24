'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Task, Priority } from '@/lib/types';
import type { TaskFormValues } from '@/components/chorey/add-task-dialog';
import { TASKS } from '@/lib/data';

type TaskContextType = {
  tasks: Task[];
  addTask: (taskData: Partial<TaskFormValues> & { title: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [searchTerm, setSearchTerm] = useState('');

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

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

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
    <TaskContext.Provider value={{ tasks, addTask, updateTask, toggleSubtaskCompletion, searchTerm, setSearchTerm }}>
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
