
'use server';

/**
 * @fileOverview AI agent that suggests the optimal task assignee.
 *
 * - suggestTaskAssignee - A function that suggests the optimal task assignee.
 * - SuggestTaskAssigneeInput - The input type for the suggestTaskAssignee function.
 * - SuggestTaskAssigneeOutput - The return type for the suggestTaskAssignee function.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ai} from '@/ai/genkit';
import { SuggestTaskAssigneeInputSchema, SuggestTaskAssigneeOutputSchema } from '@/ai/schemas';
import type { SuggestTaskAssigneeInput, SuggestTaskAssigneeOutput } from '@/ai/schemas';
import type { User, Task } from '@/lib/types';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-task-assignee.prompt'), 'utf-8');

function getTaskHistory(allTasks: Task[], allUsers: User[]) {
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return allTasks
        .filter(task => task.status === 'Voltooid' && task.completedAt && task.createdAt)
        .map(task => {
            const assignee = task.assigneeIds.map((id: string) => userMap.get(id)?.name).filter(Boolean).join(', ');
            // Ensure dates are valid before calculating difference
            const completedAt = new Date(task.completedAt!);
            const createdAt = new Date(task.createdAt);
            const completionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // in hours
            
            return {
                assignee: assignee || 'Unknown',
                taskDescription: task.description,
                completionTime: completionTime,
            };
    }).filter(th => th.completionTime > 0);
};

export async function suggestTaskAssignee(taskDescription: string, orgUsers: User[], allTasks: Task[]): Promise<{ output: SuggestTaskAssigneeOutput, input: SuggestTaskAssigneeInput }> {
  if (orgUsers.length === 0) {
      const output = { suggestedAssignee: 'Niemand', reasoning: 'Er zijn geen gebruikers in deze organisatie om aan toe te wijzen.' };
      return { output, input: { taskDescription } };
  }

  const assigneeSkills = orgUsers.reduce((acc, user) => {
      acc[user.name] = user.skills || [];
      return acc;
  }, {} as Record<string, string[]>);
  
  const taskHistory = getTaskHistory(allTasks, allUsers);
  const input = { taskDescription, assigneeSkills, taskHistory };
  const output = await suggestTaskAssigneeFlow(input);
  return { output, input };
}

const prompt = ai.definePrompt({
  name: 'suggestTaskAssigneePrompt',
  input: {schema: SuggestTaskAssigneeInputSchema},
  output: {schema: SuggestTaskAssigneeOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest', 
  prompt: promptText, 
});

const suggestTaskAssigneeFlow = ai.defineFlow(
  {
    name: 'suggestTaskAssigneeFlow',
    inputSchema: SuggestTaskAssigneeInputSchema,
    outputSchema: SuggestTaskAssigneeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
