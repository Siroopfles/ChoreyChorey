
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import type { User, Organization, SuggestStoryPointsInput, Project } from '@/lib/types';
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
import { suggestProactiveHelp } from '@/ai/flows/suggest-proactive-help-flow';
import { suggestStatusUpdate } from '@/ai/flows/suggest-status-update-flow';
import { predictBurnoutRisk } from '@/ai/flows/predict-burnout-risk-flow';
import { generateProjectReport } from '@/ai/flows/generate-project-report-flow';
import { predictProjectOutcome } from '@/ai/flows/predict-project-outcome-flow';
import type { MultiSpeakerTextToSpeechInput, SuggestPriorityInput, IdentifyRiskInput, GenerateTaskImageInput, SuggestLabelsInput, MeetingToTasksInput, FindDuplicateTaskInput, NotificationDigestInput, LevelWorkloadInput, SuggestHeadcountInput, SuggestHeadcountOutput, SuggestProactiveHelpInput, SuggestProactiveHelpOutput, SuggestStatusUpdateInput, SuggestStatusUpdateOutput, PredictBurnoutRiskOutput, GenerateProjectReportOutput, PredictProjectOutcomeOutput } from '@/ai/schemas';

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

export async function handleSuggestStoryPoints(title: string, organizationId: string, description?: string) {
    try {
        // RAG: Retrieve recent tasks with story points to provide context.
        const q = query(
            collection(db, 'tasks'),
            where('organizationId', '==', organizationId),
            where('storyPoints', '!=', null),
            orderBy('createdAt', 'desc'),
            limit(50) 
        );

        const snapshot = await getDocs(q);

        const taskHistory = snapshot.docs
            .map(doc => doc.data())
            .filter(data => data.status === 'Voltooid') // Filter for completed tasks
            .slice(0, 15) // Take the most recent 15
            .map(data => ({
                title: data.title,
                description: data.description,
                points: data.storyPoints,
            }));

        const suggestion = await suggestStoryPoints({ title, description, taskHistory });
        return { suggestion };
    } catch (e: any) {
        console.error("Error in handleSuggestStoryPoints RAG:", e);
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

export async function handleGenerateTaskImage(input: Omit<GenerateTaskImageInput, 'primaryColor'>, organizationId: string) {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        const primaryColor = orgDoc.exists() ? (orgDoc.data() as Organization).settings?.branding?.primaryColor : undefined;

        const result = await generateTaskImage({ ...input, primaryColor });
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

export async function handleSuggestLabels(input: Omit<SuggestLabelsInput, 'availableLabels'>, organizationId: string) {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
            return { error: 'Organisatie niet gevonden.' };
        }
        const orgData = orgDoc.data() as Organization;
        const availableLabels = orgData.settings?.customization?.labels || [];

        if (availableLabels.length === 0) {
            return { labels: [] };
        }

        const result = await suggestLabels({ ...input, availableLabels });
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

export async function handleSuggestProactiveHelp(input: SuggestProactiveHelpInput): Promise<{ suggestion: SuggestProactiveHelpOutput | null, error?: string }> {
    try {
        const suggestion = await suggestProactiveHelp(input);
        return { suggestion };
    } catch (e: any) {
        return { error: e.message, suggestion: null };
    }
}

export async function handleSuggestStatusUpdate(input: SuggestStatusUpdateInput): Promise<{ suggestion: SuggestStatusUpdateOutput | null, error?: string }> {
    try {
        const suggestion = await suggestStatusUpdate(input);
        return { suggestion };
    } catch (e: any) {
        return { error: e.message, suggestion: null };
    }
}

export async function handlePredictBurnoutRisk(userId: string, userName: string, organizationId: string): Promise<{ result: PredictBurnoutRiskOutput | null, error?: string }> {
    try {
        const result = await predictBurnoutRisk({ userId, userName, organizationId });
        return { result };
    } catch (e: any) {
        return { error: e.message, result: null };
    }
}

export async function handleGenerateProjectReport(projectId: string, projectName: string, organizationId: string): Promise<{ result: GenerateProjectReportOutput | null, error?: string }> {
    try {
        const result = await generateProjectReport({ projectId, projectName, organizationId });
        return { result };
    } catch (e: any) {
        return { error: e.message, result: null };
    }
}

export async function handlePredictProjectOutcome(projectId: string, organizationId: string): Promise<{ result: PredictProjectOutcomeOutput | null, error?: string }> {
    try {
        // 1. Get project details
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
            return { error: 'Project niet gevonden.', result: null };
        }
        const projectData = projectDoc.data() as Project;

        // 2. Get all tasks for the project
        const projectTasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
        const projectTasksSnapshot = await getDocs(projectTasksQuery);
        const projectTasks = projectTasksSnapshot.docs.map(d => {
            const data = d.data();
            // Basic serialization for the prompt
            return {
                title: data.title,
                status: data.status,
                priority: data.priority,
                storyPoints: data.storyPoints,
                cost: data.cost,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
                dueDate: (data.dueDate as Timestamp)?.toDate()?.toISOString(),
                completedAt: (data.completedAt as Timestamp)?.toDate()?.toISOString(),
            };
        });

        // 3. Get recent historical tasks from the whole org for velocity context (RAG)
        const historicalTasksQuery = query(
            collection(db, 'tasks'),
            where('organizationId', '==', organizationId),
            where('status', '==', 'Voltooid'),
            orderBy('completedAt', 'desc'),
            limit(100)
        );
        const historicalTasksSnapshot = await getDocs(historicalTasksQuery);
        const historicalTasks = historicalTasksSnapshot.docs.map(d => {
            const data = d.data();
            return {
                title: data.title,
                storyPoints: data.storyPoints,
                cost: data.cost,
                completionTimeHours: data.completedAt && data.createdAt ? ((data.completedAt as Timestamp).toMillis() - (data.createdAt as Timestamp).toMillis()) / 3600000 : null,
            };
        });

        // 4. Call the AI flow with all the context
        const result = await predictProjectOutcome({
            projectName: projectData.name,
            projectDeadline: projectData.deadline?.toISOString().split('T')[0],
            projectBudget: projectData.budget,
            projectBudgetType: projectData.budgetType,
            projectTasks,
            historicalTasks,
        });

        return { result };

    } catch (e: any) {
        return { error: e.message, result: null };
    }
}
