
'use server';
/**
 * @fileOverview An AI agent that analyzes the sentiment of a piece of text.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { AnalyzeSentimentInputSchema, AnalyzeSentimentOutputSchema } from '@/ai/schemas';
import type { AnalyzeSentimentInput, AnalyzeSentimentOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/analyze-sentiment.prompt'), 'utf-8');

export async function analyzeSentiment(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentimentPrompt',
  input: { schema: AnalyzeSentimentInputSchema },
  output: { schema: AnalyzeSentimentOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: promptText,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
