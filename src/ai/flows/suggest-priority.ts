
'use server';
/**
 * @fileOverview AI agent that suggests a priority for a task.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { SuggestPriorityInputSchema, SuggestPriorityOutputSchema } from '@/ai/schemas';
import type { SuggestPriorityInput, SuggestPriorityOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-priority.prompt'), 'utf-8');

export async function suggestPriority(input: SuggestPriorityInput): Promise<SuggestPriorityOutput> {
  return suggestPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPriorityPrompt',
  input: { schema: SuggestPriorityInputSchema },
  output: { schema: SuggestPriorityOutputSchema },
  model: 'gemini-pro',
  prompt: promptText,
});

const suggestPriorityFlow = ai.defineFlow(
  {
    name: 'suggestPriorityFlow',
    inputSchema: SuggestPriorityInputSchema,
    outputSchema: SuggestPriorityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
