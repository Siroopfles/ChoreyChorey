'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, getDoc, doc } from 'firebase/firestore';
import type { User, Organization } from '@/lib/types';
import { DEFAULT_ROLES } from '@/lib/types';
import { suggestTaskAssignee } from '@/ai/flows/suggest-task-assignee';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks';
import { processCommand } from '@/ai/flows/process-command';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { suggestStoryPoints } from '@/ai/flows/suggest-story-points';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { multiSpeakerTextToSpeech } from '@/ai/flows/multi-speaker-tts-flow';
import { suggestPriority } from '@/ai/flows/suggest-priority';
import { identifyRisk } from '@/ai/flows/identify-risk';
import { suggestLabels } from '@/ai/flows/suggest-labels-flow';
import { meetingToTasks } from '@/ai/flows/meeting-to-tasks-flow';
import { findDuplicateTask } from '@/ai/flows/find-duplicate-task-flow';
import { generateNotificationDigest } from '@/ai/flows/notification-digest-flow';
import { levelWorkload } from '@/ai/flows/level-workload-flow';
import { suggestHeadcount } from '@/ai/flows/suggest-headcount-flow';
import type { MultiSpeakerTextToSpeechInput, SuggestPriorityInput, IdentifyRiskInput, GenerateTaskImageInput, SuggestLabelsInput, MeetingToTasksInput, FindDuplicateTaskInput, NotificationDigestInput, LevelWorkloadInput, SuggestHeadcountInput, SuggestHeadcountOutput } from '@/ai/schemas';

async function getTaskHistory(organizationId: string) {
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

export async function handleProcessCommand(command: string, userId: string, organizationId: string, userName: string) {
    try {
        const result = await processCommand({ command, userId, organizationId, userName });
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

export async function handleGenerateTaskImage(input: GenerateTaskImageInput) {
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

export async function handleMultiSpeakerTextToSpeech(input: MultiSpeakerTextToSpeechInput) {
    try {
        const result = await multiSpeakerTextToSpeech(input);
        return { audioDataUri: result.audioDataUri };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestPriority(input: SuggestPriorityInput) {
    try {
        const suggestion = await suggestPriority(input);
        return { suggestion };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleIdentifyRisk(input: IdentifyRiskInput) {
    try {
        const analysis = await identifyRisk(input);
        return { analysis };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestLabels(input: SuggestLabelsInput) {
    try {
        const result = await suggestLabels(input);
        return { labels: result.labels };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleMeetingToTasks(input: Omit<MeetingToTasksInput, 'currentDate'>) {
    try {
        const result = await meetingToTasks(input);
        return { summary: result };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleFindDuplicateTask(input: FindDuplicateTaskInput) {
    try {
        const result = await findDuplicateTask(input);
        return { result };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleNotificationDigest(input: NotificationDigestInput) {
    try {
        const summary = await generateNotificationDigest(input);
        return { summary };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleLevelWorkload(input: LevelWorkloadInput) {
    try {
        const summary = await levelWorkload(input);
        return { summary };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function handleSuggestHeadcount(organizationId: string, projectDescription: string) {
    try {
        const orgUsersSnapshot = await getDocs(query(collection(db, 'users'), where('organizationIds', 'array-contains', organizationId)));
        
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
            return { error: "Organisatie niet gevonden." };
        }
        const orgData = orgDoc.data() as Organization;
        const orgMembers = orgData.members || {};
        const allRoles = { ...DEFAULT_ROLES, ...(orgData.settings?.customization?.customRoles || {}) };

        const availableUsers = orgUsersSnapshot.docs.map(doc => {
            const userData = doc.data() as User;
            const roleId = orgMembers[doc.id]?.role || 'Member';
            const roleName = allRoles[roleId]?.name || roleId;
            return {
                id: doc.id,
                name: userData.name,
                role: roleName,
                skills: userData.skills || []
            }
        });

        const result = await suggestHeadcount({ projectDescription, availableUsers });
        return { result };
    } catch (e: any) {
        return { error: e.message };
    }
}
