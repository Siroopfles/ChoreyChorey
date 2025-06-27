
'use server';
/**
 * @fileOverview A set of AI tools for interacting with tasks in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Status, Task } from '@/lib/types';

// Helper to add history entries
const addHistoryEntry = (userId: string | null, action: string, details?: string) => {
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

// Schema for creating a task
const CreateTaskDataSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The detailed description of the task.'),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional().describe('The priority of the task.'),
  assigneeIds: z.array(z.string()).optional().describe('The IDs of the users the task is assigned to.'),
  labels: z.array(z.string()).optional().describe('A list of labels for the task.'),
  dueDate: z.string().optional().describe("The due date and time in 'YYYY-MM-DDTHH:mm:ss' ISO 8601 format. The AI should convert natural language dates like 'tomorrow at 10am' into this format."),
  isPrivate: z.boolean().optional().describe('Whether the task is private to the creator and assignee. Should be true for personal reminders.'),
});

export const createTask = ai.defineTool(
  {
    name: 'createTask',
    description: 'Create a new task.',
    inputSchema: z.object({
      organizationId: z.string().describe('The ID of the organization.'),
      creatorId: z.string().describe('The ID of the user creating the task.'),
      taskData: CreateTaskDataSchema,
    }),
    outputSchema: z.object({
      taskId: z.string().describe('The ID of the newly created task.'),
    }),
  },
  async ({ organizationId, creatorId, taskData }) => {
    const firestoreTask: any = {
      ...taskData,
      status: 'Te Doen' as Status,
      creatorId: creatorId,
      createdAt: new Date(),
      order: Date.now(),
      organizationId: organizationId,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      history: [addHistoryEntry(creatorId, 'Aangemaakt', `via AI commando.`)],
      isPrivate: taskData.isPrivate ?? false,
      assigneeIds: taskData.assigneeIds ?? [],
      // Add defaults for fields not in schema to avoid Firestore errors
      subtasks: [],
      attachments: [],
      comments: [],
      teamId: null,
      completedAt: null,
      storyPoints: null,
      blockedBy: [],
      recurring: null,
      imageDataUri: null,
      thanked: false,
      timeLogged: 0,
      activeTimerStartedAt: null,
    };

    // Firestore doesn't like 'undefined' values from optional Zod fields
    Object.keys(firestoreTask).forEach(key => {
        if (firestoreTask[key] === undefined) {
            delete firestoreTask[key];
        }
    });
    
    const docRef = await addDoc(collection(db, 'tasks'), firestoreTask);
    return { taskId: docRef.id };
  }
);

// Schema for task search filters
const TaskSearchFiltersSchema = z.object({
  status: z.enum(['Te Doen', 'In Uitvoering', 'In Review', 'Voltooid', 'Gearchiveerd', 'Geannuleerd']).optional(),
  priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional(),
  assigneeId: z.string().optional().describe('Filter by the ID of an assigned user.'),
  labels: z.array(z.string()).optional().describe('Filter by a list of labels.'),
  term: z.string().optional().describe('A search term to match in the title or description.'),
});

// Search Tasks Tool
export const searchTasks = ai.defineTool(
  {
    name: 'searchTasks',
    description: 'Search for existing tasks based on filters.',
    inputSchema: z.object({
      organizationId: z.string().describe('The ID of the organization to search within.'),
      filters: TaskSearchFiltersSchema,
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: z.string(),
        priority: z.string().nullable(),
        assigneeIds: z.array(z.string()),
        dueDate: z.string().nullable(),
      })
    ),
  },
  async ({ organizationId, filters }) => {
    let q = query(collection(db, 'tasks'), where('organizationId', '==', organizationId));

    // Add extra checks to ensure no undefined values are passed to where()
    if (typeof filters.status === 'string' && filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (typeof filters.priority === 'string' && filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (typeof filters.assigneeId === 'string' && filters.assigneeId) {
      q = query(q, where('assigneeIds', 'array-contains', filters.assigneeId));
    }
    if (Array.isArray(filters.labels) && filters.labels.length > 0) {
      const validLabels = filters.labels.filter(label => typeof label === 'string' && label);
      if (validLabels.length > 0) {
        q = query(q, where('labels', 'array-contains-any', validLabels));
      }
    }
    
    const snapshot = await getDocs(q);
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    if (filters.term) {
        const lowercasedTerm = filters.term.toLowerCase();
        tasks = tasks.filter(task => 
            task.title.toLowerCase().includes(lowercasedTerm) || 
            (task.description && task.description.toLowerCase().includes(lowercasedTerm))
        );
    }

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || null,
      assigneeIds: task.assigneeIds,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
    }));
  }
);

// Schema for updating a task
const TaskUpdateDataSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['Te Doen', 'In Uitvoering', 'In Review', 'Voltooid', 'Gearchiveerd', 'Geannuleerd']).optional(),
    priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional(),
    assigneeIds: z.array(z.string()).optional().describe("Replace the current list of assignee IDs with this new list."),
    add_subtask: z.string().optional().describe("A subtask description to add to the task.")
});

// Update Task Tool
export const updateTask = ai.defineTool(
    {
        name: 'updateTask',
        description: 'Update an existing task by its ID.',
        inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to update.'),
            userId: z.string().describe('The ID of the user performing the update.'),
            updates: TaskUpdateDataSchema,
        }),
        outputSchema: z.object({
            success: z.boolean(),
        }),
    },
    async ({ taskId, userId, updates }) => {
        const taskRef = doc(db, 'tasks', taskId);
        const historyEntries = [];

        if(updates.add_subtask) {
            const newSubtask = {
                id: crypto.randomUUID(),
                text: updates.add_subtask,
                completed: false,
            };
            await updateDoc(taskRef, { subtasks: arrayUnion(newSubtask) });
            historyEntries.push(addHistoryEntry(userId, 'Subtaak toegevoegd', `"${updates.add_subtask}"`));
            delete (updates as any).add_subtask;
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(taskRef, { ...updates });
             historyEntries.push(addHistoryEntry(userId, 'Taak bijgewerkt', `via AI commando.`));
        }

        if (historyEntries.length > 0) {
             await updateDoc(taskRef, { history: arrayUnion(...historyEntries) });
        }
        
        return { success: true };
    }
);

export const getUsers = ai.defineTool(
    {
        name: 'getUsers',
        description: 'Get a list of users in the organization.',
        inputSchema: z.object({
            organizationId: z.string().describe('The ID of the organization.'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    },
    async ({ organizationId }) => {
        const q = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        return users;
    }
);
