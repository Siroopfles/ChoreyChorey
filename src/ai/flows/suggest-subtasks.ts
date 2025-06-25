'use server';
/**
 * @fileOverview AI agent that suggests subtasks for a given task.
 *
 * - suggestSubtasks - A function that suggests subtasks.
 * - SuggestSubtasksInput - The input type for the suggestSubtasks function.
 * - SuggestSubtasksOutput - The return type for the suggestSubtasks function.
 */

import {ai} from '@/ai/genkit';
import { SuggestSubtasksInputSchema, SuggestSubtasksOutputSchema } from '@/ai/schemas';
import type { SuggestSubtasksInput, SuggestSubtasksOutput } from '@/ai/schemas';

export async function suggestSubtasks(input: SuggestSubtasksInput): Promise<SuggestSubtasksOutput> {
  return suggestSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubtasksPrompt',
  input: {schema: SuggestSubtasksInputSchema},
  output: {schema: SuggestSubtasksOutputSchema},
  prompt: `Je bent een efficiënte projectmanager. Jouw taak is om een hoofdtaak op te splitsen in kleinere, uitvoerbare subtaken.

Hoofdtaak Titel: {{{title}}}
{{#if description}}
Hoofdtaak Omschrijving: {{{description}}}
{{/if}}

Geef een lijst met logische subtaken die nodig zijn om deze hoofdtaak te voltooien. Zorg ervoor dat de uitvoer alleen een JSON-object is met een "subtasks" array van strings.
`,
});

const suggestSubtasksFlow = ai.defineFlow(
  {
    name: 'suggestSubtasksFlow',
    inputSchema: SuggestSubtasksInputSchema,
    outputSchema: SuggestSubtasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
