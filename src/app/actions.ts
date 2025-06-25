'use server';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks';
import { processCommand } from '@/ai/flows/process-command';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';

import type { 
    SuggestTaskAssigneeInput,
    SuggestSubtasksInput,
    ProcessCommandInput,
    SummarizeCommentsInput,
    SuggestStoryPointsInput,
    GenerateAvatarInput,
    GenerateTaskImageInput,
    TextToSpeechInput,
} from '@/ai/schemas';
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

export async function handleSummarizeComments(comments: string[]) {
    if (!comments || comments.length === 0) {
        return { error: 'No comments to summarize.' };
    }

    try {
        const input: SummarizeCommentsInput = { comments };
        const result = await summarizeComments(input);
        return { summary: result.summary };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get AI summary.' };
    }
}

export async function handleSuggestStoryPoints(title: string, description?: string) {
    if (!title) {
        return { error: 'Task title is required to suggest story points.' };
    }

    try {
        const input: SuggestStoryPointsInput = { title, description };
        const result = await suggestStoryPoints(input);
        return { suggestion: result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get AI story point suggestion.' };
    }
}

export async function handleGenerateAvatar(name: GenerateAvatarInput) {
    try {
        const result = await generateAvatar(name);
        return { avatarDataUri: result.avatarDataUri };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to generate AI avatar.' };
    }
}

export async function handleGenerateTaskImage(input: GenerateTaskImageInput) {
    try {
        const result = await generateTaskImage(input);
        return { imageDataUri: result.imageDataUri };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to generate AI task image.' };
    }
}

export async function handleTextToSpeech(text: TextToSpeechInput) {
    try {
        const result = await textToSpeech(text);
        return { audioDataUri: result.audioDataUri };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to synthesize speech.' };
    }
}
