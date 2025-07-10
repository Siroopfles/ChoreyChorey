
'use server';
/**
 * @fileOverview An AI agent that converts a high-level goal into a structured project plan.
 * - goalToProject - A function that handles the conversion process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { GoalToProjectInputSchema, GoalToProjectOutputSchema } from '@/ai/schemas';
import type { GoalToProjectInput, GoalToProjectOutput } from '@/ai/schemas';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Organization } from '@/lib/types';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/goal-to-project.prompt'), 'utf-8');

export async function goalToProject(input: Omit<GoalToProjectInput, 'availablePriorities'>): Promise<GoalToProjectOutput> {
  const orgDoc = await getDoc(doc(db, 'organizations', input.organizationId));
  if (!orgDoc.exists()) {
    throw new Error('Organisatie niet gevonden.');
  }
  const orgData = orgDoc.data() as Organization;
  const availablePriorities = (orgData.settings?.customization?.priorities || []).map(p => p.name);

  return goalToProjectFlow({ ...input, availablePriorities });
}

const prompt = ai.definePrompt({
  name: 'goalToProjectPrompt',
  input: { schema: GoalToProjectInputSchema },
  output: { schema: GoalToProjectOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: promptText,
});

const goalToProjectFlow = ai.defineFlow(
  {
    name: 'goalToProjectFlow',
    inputSchema: GoalToProjectInputSchema,
    outputSchema: GoalToProjectOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
