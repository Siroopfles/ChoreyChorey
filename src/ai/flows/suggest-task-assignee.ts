'use server';

/**
 * @fileOverview AI agent that suggests the optimal task assignee.
 *
 * - suggestTaskAssignee - A function that suggests the optimal task assignee.
 * - SuggestTaskAssigneeInput - The input type for the suggestTaskAssignee function.
 * - SuggestTaskAssigneeOutput - The return type for the suggestTaskAssignee function.
 */

import {ai} from '@/ai/genkit';
import { SuggestTaskAssigneeInputSchema, SuggestTaskAssigneeOutputSchema } from '@/ai/schemas';
import type { SuggestTaskAssigneeInput, SuggestTaskAssigneeOutput } from '@/ai/schemas';
import type { User, Task } from '@/lib/types';


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

export async function suggestTaskAssignee(taskDescription: string, orgUsers: User[], allTasks: Task[]): Promise<SuggestTaskAssigneeOutput> {
  if (orgUsers.length === 0) {
      return { suggestedAssignee: 'Niemand', reasoning: 'Er zijn geen gebruikers in deze organisatie om aan toe te wijzen.' };
  }

  const assigneeSkills = orgUsers.reduce((acc, user) => {
      acc[user.name] = user.skills || [];
      return acc;
  }, {} as Record<string, string[]>);
  
  const taskHistory = getTaskHistory(allTasks, orgUsers);

  return suggestTaskAssigneeFlow({ taskDescription, assigneeSkills, taskHistory });
}

const prompt = ai.definePrompt({
  name: 'suggestTaskAssigneePrompt',
  input: {schema: SuggestTaskAssigneeInputSchema},
  output: {schema: SuggestTaskAssigneeOutputSchema},
  model: 'gemini-pro',
  prompt: `Je bent een AI-assistent voor het toewijzen van taken. Je doel is om de optimale persoon voor te stellen voor een bepaalde taak, rekening houdend met hun historische prestaties en vaardigheden.

Taakomschrijving: {{{taskDescription}}}

{{#if assigneeSkills}}
Beschikbare Toewijzers en hun vaardigheden:
{{#each assigneeSkills}}
- {{@key}}: {{#if this}}{{#each this}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Geen specifieke vaardigheden.{{/if}}
{{/each}}
{{/if}}

{{#if taskHistory}}
Taakgeschiedenis:
{{#each taskHistory}}
- Toegewezen aan: {{{assignee}}}, Taak: {{{taskDescription}}}, Voltooiingstijd: {{{completionTime}}} uur
{{/each}}
{{else}}
Geen taakgeschiedenis beschikbaar.
{{/if}}

Analyseer de taakomschrijving en de vaardigheden van de beschikbare toewijzers. Geef prioriteit aan de persoon wiens vaardigheden het beste aansluiten bij de taak. Gebruik de taakgeschiedenis als een secundaire factor. Stel op basis hiervan de beste toewijzer voor en leg je redenering beknopt uit.
`, 
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
