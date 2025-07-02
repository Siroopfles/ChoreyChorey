
'use server';
/**
 * @fileOverview AI agent that suggests subtasks for a given task.
 *
 * - suggestSubtasks - A function that suggests subtasks.
 * - SuggestSubtasksInput - The input type for the suggestSubtasks function.
 * - SuggestSubtasksOutput - The return type for the suggestSubtasks function.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ai} from '@/ai/genkit';
import { SuggestSubtasksInputSchema, SuggestSubtasksOutputSchema } from '@/ai/schemas';
import type { SuggestSubtasksInput, SuggestSubtasksOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-subtasks.prompt'), 'utf-8');

export async function suggestSubtasks(input: SuggestSubtasksInput): Promise<SuggestSubtasksOutput> {
  return suggestSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubtasksPrompt',
  input: {schema: SuggestSubtasksInputSchema},
  output: {schema: SuggestSubtasksOutputSchema},
  model: 'gemini-pro',
  prompt: promptText,
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
