'use server';
/**
 * @fileOverview AI agent that suggests labels for a task.
 * - suggestLabels - A function that suggests labels for a task.
 * - SuggestLabelsInput - The input type for the suggestLabels function.
 * - SuggestLabelsOutput - The return type for the suggestLabels function.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ai} from '@/ai/genkit';
import { SuggestLabelsInputSchema, SuggestLabelsOutputSchema } from '@/ai/schemas';
import type { SuggestLabelsInput, SuggestLabelsOutput } from '@/ai/schemas';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Organization } from '@/lib/types';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-labels.prompt'), 'utf-8');

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
  prompt: promptText,
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
