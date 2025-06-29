'use server';
/**
 * @fileOverview An AI agent that proactively offers assistance for complex tasks.
 * - suggestProactiveHelp - A function that analyzes a task to see if help should be offered.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ai} from '@/ai/genkit';
import {SuggestProactiveHelpInputSchema, SuggestProactiveHelpOutputSchema} from '@/ai/schemas';
import type {SuggestProactiveHelpInput, SuggestProactiveHelpOutput} from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-proactive-help.prompt'), 'utf-8');

export async function suggestProactiveHelp(input: SuggestProactiveHelpInput): Promise<SuggestProactiveHelpOutput> {
  return suggestProactiveHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProactiveHelpPrompt',
  input: {schema: SuggestProactiveHelpInputSchema},
  output: {schema: SuggestProactiveHelpOutputSchema},
  model: 'gemini-pro',
  prompt: promptText,
});

const suggestProactiveHelpFlow = ai.defineFlow(
  {
    name: 'suggestProactiveHelpFlow',
    inputSchema: SuggestProactiveHelpInputSchema,
    outputSchema: SuggestProactiveHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
