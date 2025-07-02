
'use server';
/**
 * @fileOverview An AI agent that identifies potential risks in a task.
 * - identifyRisk - A function that analyzes a task for risks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { IdentifyRiskInputSchema, IdentifyRiskOutputSchema } from '@/ai/schemas';
import type { IdentifyRiskInput, IdentifyRiskOutput } from '@/ai/schemas';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/identify-risk.prompt'), 'utf-8');

export async function identifyRisk(input: IdentifyRiskInput): Promise<IdentifyRiskOutput> {
  return identifyRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRiskPrompt',
  input: { schema: IdentifyRiskInputSchema },
  output: { schema: IdentifyRiskOutputSchema },
  model: 'gemini-pro',
  prompt: promptText,
});

const identifyRiskFlow = ai.defineFlow(
  {
    name: 'identifyRiskFlow',
    inputSchema: IdentifyRiskInputSchema,
    outputSchema: IdentifyRiskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
