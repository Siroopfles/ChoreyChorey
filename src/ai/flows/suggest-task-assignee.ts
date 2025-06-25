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


export async function suggestTaskAssignee(input: SuggestTaskAssigneeInput): Promise<SuggestTaskAssigneeOutput> {
  return suggestTaskAssigneeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskAssigneePrompt',
  input: {schema: SuggestTaskAssigneeInputSchema},
  output: {schema: SuggestTaskAssigneeOutputSchema},
  model: 'gemini-pro',
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
