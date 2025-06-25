
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, updateDoc, doc, writeBatch, addDoc, arrayUnion, arrayRemove, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import type { User, Organization, Invite, Task } from '@/lib/types';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks';
import { processCommand } from '@/ai/flows/process-command';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { auth } from '@/lib/firebase';

const getTaskHistory = async (organizationId: string) => {
    const tasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', organizationId), where('status', '==', 'Voltooid'));
    const usersQuery = query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId));

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

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar' | 'skills'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { error: error.message };
    }
}

export async function handleSuggestAssignee(taskDescription: string, organizationId: string) {
    try {
        const orgUsersSnapshot = await getDocs(query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId)));
        const orgUsers = orgUsersSnapshot.docs.map(doc => doc.data() as User);

        if (orgUsers.length === 0) {
            return { suggestion: { suggestedAssignee: 'Niemand', reasoning: 'Er zijn geen gebruikers in deze organisatie om aan toe te wijzen.' } };
        }

        const assigneeSkills = orgUsers.reduce((acc, user) => {
            acc[user.name] = user.skills || [];
            return acc;
        }, {} as Record<string, string[]>);
        
        const taskHistory = await getTaskHistory(organizationId);
        const suggestion = await suggestTaskAssignee({ taskDescription, assigneeSkills, taskHistory });
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

export async function createOrganizationInvite(organizationId: string, inviterId: string) {
    try {
        const newInviteRef = doc(collection(db, 'invites'));
        const newInvite: Omit<Invite, 'id'> = {
            organizationId,
            inviterId,
            status: 'pending',
            createdAt: new Date(),
        };
        await setDoc(newInviteRef, newInvite);
        return { success: true, inviteId: newInviteRef.id };
    } catch (error: any) {
        console.error("Error creating invite:", error);
        return { error: error.message };
    }
}

export async function getInviteDetails(inviteId: string) {
    try {
        const inviteRef = doc(db, 'invites', inviteId);
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists() || inviteDoc.data().status !== 'pending') {
            return { error: 'Uitnodiging is ongeldig of al gebruikt.' };
        }
        
        const organizationRef = doc(db, 'organizations', inviteDoc.data().organizationId);
        const organizationDoc = await getDoc(organizationRef);
        
        if (!organizationDoc.exists()) {
             return { error: 'De organisatie voor deze uitnodiging bestaat niet meer.' };
        }

        return {
            success: true,
            invite: { id: inviteDoc.id, ...inviteDoc.data() } as Invite,
            organization: { id: organizationDoc.id, ...organizationDoc.data() } as Organization,
        };

    } catch(e: any) {
        return { error: e.message };
    }
}

export async function acceptOrganizationInvite(inviteId: string, userId: string) {
     try {
        await runTransaction(db, async (transaction) => {
            const inviteRef = doc(db, 'invites', inviteId);
            const userRef = doc(db, 'users', userId);

            const inviteDoc = await transaction.get(inviteRef);
            if (!inviteDoc.exists() || inviteDoc.data().status !== 'pending') {
                throw new Error("Uitnodiging is ongeldig of al gebruikt.");
            }

            const organizationId = inviteDoc.data().organizationId;

            transaction.update(userRef, {
                organizationIds: arrayUnion(organizationId),
                currentOrganizationId: organizationId,
            });
            
            transaction.update(inviteRef, {
                status: 'accepted'
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error accepting invite:", error);
        return { error: error.message };
    }
}
