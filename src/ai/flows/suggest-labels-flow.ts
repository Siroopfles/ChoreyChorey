'use server';
/**
 * @fileOverview AI agent that suggests labels for a task.
 * - suggestLabels - A function that suggests labels for a task.
 * - SuggestLabelsInput - The input type for the suggestLabels function.
 * - SuggestLabelsOutput - The return type for the suggestLabels function.
 */

import {ai} from '@/ai/genkit';
import { SuggestLabelsInputSchema, SuggestLabelsOutputSchema } from '@/ai/schemas';
import type { SuggestLabelsInput, SuggestLabelsOutput } from '@/ai/schemas';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Organization } from '@/lib/types';

export async function suggestLabels(input: Omit<SuggestLabelsInput, 'availableLabels'> & { organizationId: string }): Promise<SuggestLabelsOutput> {
  const orgDoc = await getDoc(doc(db, 'organizations', input.organizationId));
  if (!orgDoc.exists()) {
      return { labels: [] }; // Or throw an error
  }
  const orgData = orgDoc.data() as Organization;
  const availableLabels = orgData.settings?.customization?.labels || [];

  if (availableLabels.length === 0) {
      return { labels: [] };
  }

  return suggestLabelsFlow({ ...input, availableLabels });
}

const prompt = ai.definePrompt({
  name: 'suggestLabelsPrompt',
  input: {schema: SuggestLabelsInputSchema},
  output: {schema: SuggestLabelsOutputSchema},
  model: 'gemini-pro',
  prompt: `Je bent een expert in taakbeheer. Analyseer de titel en omschrijving van de volgende taak en kies 1 tot 3 relevante labels uit de onderstaande lijst.

Beschikbare labels: {{#each availableLabels}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Taak Titel: {{{title}}}
{{#if description}}
Taak Omschrijving: {{{description}}}
{{/if}}

Zorg ervoor dat de uitvoer alleen een JSON-object is met een "labels" array van strings, waarbij de strings exact overeenkomen met de labels uit de lijst. Geef alleen labels terug die echt relevant zijn.
`,
});

const suggestLabelsFlow = ai.defineFlow(
  {
    name: 'suggestLabelsFlow',
    inputSchema: SuggestLabelsInputSchema,
    outputSchema: SuggestLabelsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
