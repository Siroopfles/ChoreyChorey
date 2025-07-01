
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
import { db } from '@/lib/core/firebase';
import type { Organization } from '@/lib/types';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-labels.prompt'), 'utf-8');

export async function suggestLabels(input: Omit<SuggestLabelsInput, 'availableLabels'> & { organizationId: string }): Promise<{ output: SuggestLabelsOutput; input: SuggestLabelsInput }> {
  const orgDoc = await getDoc(doc(db, 'organizations', input.organizationId));
  const availableLabels = (orgDoc.exists() ? (orgDoc.data() as Organization).settings?.customization?.labels : []) || [];
  const flowInput: SuggestLabelsInput = { ...input, availableLabels };

  if (availableLabels.length === 0) {
      return { output: { labels: [] }, input: flowInput };
  }

  const output = await suggestLabelsFlow(flowInput);
  return { output, input: flowInput };
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
