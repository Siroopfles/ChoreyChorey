'use server';

/**
 * @fileOverview AI agent that suggests the optimal task assignee.
 *
 * - suggestTaskAssignee - A function that suggests the optimal task assignee.
 * - SuggestTaskAssigneeInput - The input type for the suggestTaskAssignee function.
 * - SuggestTaskAssigneeOutput - The return type for the suggestTaskAssignee function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskAssigneeInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task to be assigned.'),
  availableAssignees: z.array(z.string()).describe('The list of available assignees for the task.'),
  taskHistory: z.array(z.object({
    assignee: z.string(),
    taskDescription: z.string(),
    completionTime: z.number().describe('The time taken to complete the task in hours.'),
  })).optional().describe('Historical data of task completion times for each assignee.'),
  assigneePreferences: z.record(z.string(), z.number().min(0).max(1)).optional().describe('A map of assignee names to their preference for the given task, from 0 to 1.'),
});
export type SuggestTaskAssigneeInput = z.infer<typeof SuggestTaskAssigneeInputSchema>;

const SuggestTaskAssigneeOutputSchema = z.object({
  suggestedAssignee: z.string().describe('The suggested assignee for the task.'),
  reasoning: z.string().describe('The reasoning behind the suggestion.'),
});
export type SuggestTaskAssigneeOutput = z.infer<typeof SuggestTaskAssigneeOutputSchema>;

export async function suggestTaskAssignee(input: SuggestTaskAssigneeInput): Promise<SuggestTaskAssigneeOutput> {
  return suggestTaskAssigneeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskAssigneePrompt',
  input: {schema: SuggestTaskAssigneeInputSchema},
  output: {schema: SuggestTaskAssigneeOutputSchema},
  prompt: `Je bent een AI-assistent voor het toewijzen van taken. Je doel is om de optimale persoon voor te stellen voor een bepaalde taak, rekening houdend met hun historische prestaties en voorkeuren.

Taakomschrijving: {{{taskDescription}}}
Beschikbare Toewijzers: {{#each availableAssignees}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if taskHistory}}
Taakgeschiedenis:
{{#each taskHistory}}
- Toegewezen aan: {{{assignee}}}, Taak: {{{taskDescription}}}, Voltooiingstijd: {{{completionTime}}} uur
{{/each}}
{{else}}
Geen taakgeschiedenis beschikbaar.
{{/if}}

{{#if assigneePreferences}}
Voorkeuren Toewijzer:
{{#each assigneePreferences}}
- Toegewezen aan: {{@key}}, Voorkeur: {{{this}}}
{{/each}}
{{else}}
Geen voorkeuren van de toewijzer beschikbaar.
{{/if}}

Stel op basis van de taakomschrijving, beschikbare toewijzers, taakgeschiedenis en voorkeuren van de toewijzer de beste toewijzer voor de taak voor en leg je redenering uit. Wees beknopt en vermijd onnodige details.
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
