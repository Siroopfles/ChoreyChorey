
'use server';
/**
 * @fileOverview AI agent that suggests task status updates based on activity.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { SuggestStatusUpdateInputSchema, SuggestStatusUpdateOutputSchema } from '@/ai/schemas';
import type { SuggestStatusUpdateInput, SuggestStatusUpdateOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-status-update.prompt'), 'utf-8');

export async function suggestStatusUpdate(input: SuggestStatusUpdateInput): Promise<SuggestStatusUpdateOutput> {
  return suggestStatusUpdateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStatusUpdatePrompt',
  input: { schema: SuggestStatusUpdateInputSchema },
  output: { schema: SuggestStatusUpdateOutputSchema },
  model: 'gemini-pro',
  prompt: promptText,
});

const suggestStatusUpdateFlow = ai.defineFlow(
  {
    name: 'suggestStatusUpdateFlow',
    inputSchema: SuggestStatusUpdateInputSchema,
    outputSchema: SuggestStatusUpdateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
