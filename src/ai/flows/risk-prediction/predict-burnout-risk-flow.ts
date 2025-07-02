
'use server';
/**
 * @fileOverview An AI agent that predicts potential burnout risk for a user.
 * - predictBurnoutRisk - A function that analyzes a user's workload and patterns.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai, googleAI } from '@/ai/genkit';
import { PredictBurnoutRiskInputSchema, PredictBurnoutRiskOutputSchema } from '@/ai/schemas';
import type { PredictBurnoutRiskInput, PredictBurnoutRiskOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { User } from '@/lib/types';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/predict-burnout-risk.prompt'), 'utf-8');

export async function predictBurnoutRisk(input: PredictBurnoutRiskInput): Promise<PredictBurnoutRiskOutput> {
  return predictBurnoutRiskFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictBurnoutRiskPrompt',
    input: { schema: z.object({ userName: z.string(), tasks: z.any(), workingHours: z.any().optional() }) },
    output: { schema: PredictBurnoutRiskOutputSchema },
    model: googleAI.model('gemini-1.5-flash-latest'),
    prompt: promptText,
});


const predictBurnoutRiskFlow = ai.defineFlow(
  {
    name: 'predictBurnoutRiskFlow',
    inputSchema: PredictBurnoutRiskInputSchema,
    outputSchema: PredictBurnoutRiskOutputSchema,
  },
  async (input) => {
    // 1. Get all non-completed tasks for the user.
    const existingTasks = await searchTasks({
      organizationId: input.organizationId,
      filters: { assigneeId: input.userId },
    });
    
    const activeTasks = existingTasks.filter(
      (task) => task.status !== 'Voltooid' && task.status !== 'Geannuleerd' && task.status !== 'Gearchiveerd'
    );
    
    // 2. Get user's working hours
    const userDoc = await getDoc(doc(db, 'users', input.userId));
    const workingHours = userDoc.exists() ? (userDoc.data() as User).workingHours : undefined;

    // 3. Call the LLM with the gathered data
    const { output } = await prompt({
        userName: input.userName,
        tasks: activeTasks,
        workingHours: workingHours,
    });
    
    return output!;
  }
);
