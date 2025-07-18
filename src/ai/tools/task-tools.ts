

'use server';
/**
 * @fileOverview A set of AI tools for interacting with tasks in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/core/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Status, Task } from '@/lib/types';
import { addHistoryEntry } from '@/lib/utils/history-utils';

// Schema for creating a task
const CreateTaskDataSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The detailed description of the task.'),
  priority: z.string().nullable().optional().describe('The priority of the task.'),
  assigneeIds: z.array(z.string()).nullable().optional().describe('The IDs of the users the task is assigned to.'),
  labels: z.array(z.string()).nullable().optional().describe('A list of labels for the task.'),
  dueDate: z.string().optional().nullable().describe("The due date and time in 'YYYY-MM-DDTHH:mm:ss' ISO 8601 format. The AI should convert natural language dates like 'tomorrow at 10am' into this format."),
  isPrivate: z.boolean().optional().describe('Whether the task is private to the creator and assignee. Should be true for personal reminders.'),
  projectId: z.string().optional().describe('The ID of the project this task belongs to.'),
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
      priority: taskData.priority || 'Midden',
      creatorId: creatorId,
      createdAt: new Date(),
      order: Date.now(),
      organizationId: organizationId,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      history: [addHistoryEntry(creatorId, 'Aangemaakt', `via AI commando.`)],
      labels: taskData.labels ?? [],
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
      imageUrl: null,
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
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional().describe('Filter by the ID of an assigned user.'),
  labels: z.array(z.string()).optional().describe('Filter by a list of labels.'),
  term: z.string().optional().describe('A search term to match in the title or description.'),
  projectId: z.string().optional().describe('Filter by the ID of a project.'),
});

// Search Tasks Tool
export const searchTasks = ai.defineTool(
  {
    name: 'searchTasks',
    description: 'Search for existing tasks based on filters. Can be used to find tasks to update, or to answer questions about projects.',
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
        storyPoints: z.number().nullable(),
        cost: z.number().nullable(),
      })
    ),
  },
  async ({ organizationId, filters }) => {
    try {
        if (!organizationId || typeof organizationId !== 'string') {
            console.error("CRITICAL: searchTasks called without a valid organizationId.");
            return [];
        }

        const queryConstraints: any[] = [where('organizationId', '==', organizationId)];
        
        if (filters) {
            if (filters.status && typeof filters.status === 'string') {
                queryConstraints.push(where('status', '==', filters.status));
            }
            if (filters.priority && typeof filters.priority === 'string') {
                queryConstraints.push(where('priority', '==', filters.priority));
            }
            if (filters.assigneeId && typeof filters.assigneeId === 'string') {
                queryConstraints.push(where('assigneeIds', 'array-contains', filters.assigneeId));
            }
             if (filters.projectId && typeof filters.projectId === 'string') {
                queryConstraints.push(where('projectId', '==', filters.projectId));
            }
            if (filters.labels && Array.isArray(filters.labels) && filters.labels.length > 0) {
                const validLabels = filters.labels.filter(label => typeof label === 'string' && label.length > 0);
                if (validLabels.length > 0) {
                    queryConstraints.push(where('labels', 'array-contains-any', validLabels));
                }
            }
        }
    
        const q = query(collection(db, 'tasks'), ...queryConstraints);
        const snapshot = await getDocs(q);
        
        let tasks = snapshot.docs.map(doc => {
            const data = doc.data();
            // Perform timestamp conversion here
            const convertedData: Partial<Task> = {};
            for (const key in data) {
                if (data[key] instanceof Timestamp) {
                    (convertedData as any)[key] = (data[key] as Timestamp).toDate();
                } else {
                    (convertedData as any)[key] = data[key];
                }
            }
            return { id: doc.id, ...convertedData } as Task;
        });

        // Client-side filtering for search term as Firestore doesn't support it well with other filters
        if (filters && typeof filters.term === 'string' && filters.term) {
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
          assigneeIds: task.assigneeIds || [],
          dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
          storyPoints: task.storyPoints || null,
          cost: task.cost || null,
        }));
    } catch (error: any) {
        console.error("CRITICAL ERROR in searchTasks tool:", error);
        console.error("Filters that caused the error:", JSON.stringify(filters, null, 2));
        return [];
    }
  }
);

// Schema for updating a task
const TaskUpdateDataSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assigneeIds: z.array(z.string()).optional().describe("Replace the current list of assignee IDs with this new list."),
    add_subtask: z.string().optional().describe("A subtask description to add to the task."),
    dueDate: z.string().optional().describe("Set the due date and time in 'YYYY-MM-DD' format."),
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
        
        const cleanUpdates: { [key: string]: any } = { ...updates };

        if(cleanUpdates.add_subtask) {
            const newSubtask = {
                id: crypto.randomUUID(),
                text: cleanUpdates.add_subtask,
                completed: false,
            };
            await updateDoc(taskRef, { subtasks: arrayUnion(newSubtask) });
            historyEntries.push(addHistoryEntry(userId, 'Subtaak toegevoegd', `"${cleanUpdates.add_subtask}"`));
            delete cleanUpdates.add_subtask;
        }

        if (cleanUpdates.dueDate) {
            cleanUpdates.dueDate = new Date(cleanUpdates.dueDate);
        }

        Object.keys(cleanUpdates).forEach(key => {
            if (cleanUpdates[key] === undefined) {
                delete cleanUpdates[key];
            }
        });


        if (Object.keys(cleanUpdates).length > 0) {
            await updateDoc(taskRef, cleanUpdates);
             historyEntries.push(addHistoryEntry(userId, 'Taak bijgewerkt', `via AI commando.`));
        }

        if (historyEntries.length > 0) {
             await updateDoc(taskRef, { history: arrayUnion(...historyEntries) });
        }
        
        return { success: true };
    }
);

    