'use server';
import { suggestTaskAssignee, type SuggestTaskAssigneeInput } from '@/ai/flows/suggest-task-assignee';
import { USERS, TASKS } from '@/lib/data';

const getTaskHistory = () => {
    return TASKS.filter(task => task.status === 'Done' && task.completedAt && task.assigneeId)
        .map(task => {
            const assignee = USERS.find(u => u.id === task.assigneeId);
            return {
                assignee: assignee?.name || 'Unknown',
                taskDescription: task.description,
                completionTime: (task.completedAt!.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60), // in hours
            };
        });
};

export async function handleSuggestAssignee(taskDescription: string, availableAssignees: string[]) {
    if (!taskDescription) {
        return { error: 'Task description is required.' };
    }
    
    try {
        const input: SuggestTaskAssigneeInput = {
            taskDescription,
            availableAssignees,
            taskHistory: getTaskHistory(),
            // assigneePreferences can be added here if we collect them
        };

        const result = await suggestTaskAssignee(input);
        return { suggestion: result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get AI suggestion. Please check your setup.' };
    }
}
