
'use server';
/**
 * @fileOverview AI agent that summarizes task comments.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai, googleAI } from '@/ai/genkit';
import { SummarizeCommentsInputSchema, SummarizeCommentsOutputSchema } from '@/ai/schemas';
import type { SummarizeCommentsInput, SummarizeCommentsOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/summarize-comments.prompt'), 'utf-8');

export async function summarizeComments(input: SummarizeCommentsInput): Promise<{ output: SummarizeCommentsOutput, input: SummarizeCommentsInput }> {
  const output = await summarizeCommentsFlow(input);
  return { output, input };
}

const prompt = ai.definePrompt({
  name: 'summarizeCommentsPrompt',
  input: { schema: SummarizeCommentsInputSchema },
  output: { schema: SummarizeCommentsOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: promptText,
});

const summarizeCommentsFlow = ai.defineFlow(
  {
    name: 'summarizeCommentsFlow',
    inputSchema: SummarizeCommentsInputSchema,
    outputSchema: SummarizeCommentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
