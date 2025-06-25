'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks';
import { processCommand } from '@/ai/flows/process-command';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';

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

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function handleSuggestAssignee(taskDescription: string, availableAssignees: string[]) {
    try {
        const taskHistory = await getTaskHistory();
        const suggestion = await suggestTaskAssignee({ taskDescription, availableAssignees, taskHistory });
        return { suggestion };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestSubtasks(title: string, description?: string) {
    try {
        const result = await suggestSubtasks({ title, description });
        return { subtasks: result.subtasks };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleProcessCommand(command: string) {
    try {
        const result = await processCommand(command);
        return { result };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSummarizeComments(comments: string[]) {
    try {
        const result = await summarizeComments({ comments });
        return { summary: result.summary };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestStoryPoints(title: string, description?: string) {
    try {
        const suggestion = await suggestStoryPoints({ title, description });
        return { suggestion };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleGenerateAvatar(name: string) {
    try {
        const result = await generateAvatar(name);
        return { avatarDataUri: result.avatarDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleGenerateTaskImage(input: { title: string, description?: string }) {
    try {
        const result = await generateTaskImage(input);
        return { imageDataUri: result.imageDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleTextToSpeech(text: string) {
    try {
        const result = await textToSpeech(text);
        return { audioDataUri: result.audioDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}
