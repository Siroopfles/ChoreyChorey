'use server';

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

const aiDisabledError = { error: 'AI-functionaliteit is tijdelijk uitgeschakeld.' };

export async function handleSuggestAssignee(taskDescription: string, availableAssignees: string[]) {
    console.error("AI Invocation Disabled: handleSuggestAssignee");
    return aiDisabledError;
}

export async function handleSuggestSubtasks(title: string, description?: string) {
    console.error("AI Invocation Disabled: handleSuggestSubtasks");
    return aiDisabledError;
}

export async function handleProcessCommand(command: string) {
    console.error("AI Invocation Disabled: handleProcessCommand");
    return aiDisabledError;
}

export async function handleSummarizeComments(comments: string[]) {
    console.error("AI Invocation Disabled: handleSummarizeComments");
    return aiDisabledError;
}

export async function handleSuggestStoryPoints(title: string, description?: string) {
    console.error("AI Invocation Disabled: handleSuggestStoryPoints");
    return aiDisabledError;
}

export async function handleGenerateAvatar(name: string) {
    console.error("AI Invocation Disabled: handleGenerateAvatar");
    // Return a placeholder to avoid breaking the signup flow
    return { avatarDataUri: `https://placehold.co/100x100.png` };
}

export async function handleGenerateTaskImage(input: { title: string, description?: string }) {
    console.error("AI Invocation Disabled: handleGenerateTaskImage");
    return aiDisabledError;
}

export async function handleTextToSpeech(text: string) {
    console.error("AI Invocation Disabled: handleTextToSpeech");
    return aiDisabledError;
}
