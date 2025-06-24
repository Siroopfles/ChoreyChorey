'use server';
import { suggestTaskAssignee, type SuggestTaskAssigneeInput } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks, type SuggestSubtasksInput } from '@/ai/flows/suggest-subtasks';
import { processCommand, type ProcessCommandInput } from '@/ai/flows/process-command';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Task, User } from '@/lib/types';


const getTaskHistory = async () => {
    const tasksQuery = query(collection(db, 'tasks'), where('status', '==', 'Voltooid'));
    const usersQuery = query(collection(db, 'users'));

    const [tasksSnapshot, usersSnapshot] = await Promise.all([
        getDocs(tasksQuery),
        getDocs(usersQuery)
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const userMap = new Map(users.map(u => [u.id, u]));

    return tasksSnapshot.docs.map(doc => {
        const task = doc.data();
        const assignee = task.assigneeId ? userMap.get(task.assigneeId) : null;
        const completedAt = (task.completedAt as Timestamp)?.toDate();
        const createdAt = (task.createdAt as Timestamp)?.toDate();

        return {
            assignee: assignee?.name || 'Unknown',
            taskDescription: task.description,
            completionTime: (completedAt && createdAt) ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 0, // in hours
        };
    }).filter(th => th.completionTime > 0);
};

export async function handleSuggestAssignee(taskDescription: string, availableAssignees: string[]) {
    if (!taskDescription) {
        return { error: 'Task description is required.' };
    }
    
    try {
        const taskHistory = await getTaskHistory();
        const input: SuggestTaskAssigneeInput = {
            taskDescription,
            availableAssignees,
            taskHistory,
            // assigneePreferences can be added here if we collect them
        };

        const result = await suggestTaskAssignee(input);
        return { suggestion: result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get AI suggestion. Please check your setup.' };
    }
}

export async function handleSuggestSubtasks(title: string, description?: string) {
    if (!title) {
        return { error: 'Task title is required to suggest subtasks.' };
    }
    
    try {
        const input: SuggestSubtasksInput = {
            title,
            description,
        };

        const result = await suggestSubtasks(input);
        return { subtasks: result.subtasks };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get AI subtask suggestions.' };
    }
}

export async function handleProcessCommand(command: ProcessCommandInput) {
    if (!command) {
        return { error: 'Command is required.' };
    }

    try {
        const result = await processCommand(command);
        return { result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to process AI command.' };
    }
}
