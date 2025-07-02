
'use server';
/**
 * @fileOverview An AI agent that predicts project outcomes based on current progress and historical data.
 * - predictProjectOutcome - A function that handles the project outcome prediction process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { PredictProjectOutcomeInputSchema, PredictProjectOutcomeOutputSchema } from '@/ai/schemas';
import type { PredictProjectOutcomeInput, PredictProjectOutcomeOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Project, Task } from '@/lib/types';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/predict-project-outcome.prompt'), 'utf-8');

export async function predictProjectOutcome(input: PredictProjectOutcomeInput): Promise<PredictProjectOutcomeOutput> {
  return predictProjectOutcomeFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictProjectOutcomePrompt',
    input: { schema: z.object({ 
        project: z.any(),
        projectTasks: z.any(),
        historicalTasks: z.any(),
    }) },
    output: { schema: PredictProjectOutcomeOutputSchema },
    model: 'gemini-pro',
    prompt: promptText,
});

const predictProjectOutcomeFlow = ai.defineFlow(
  {
    name: 'predictProjectOutcomeFlow',
    inputSchema: PredictProjectOutcomeInputSchema,
    outputSchema: PredictProjectOutcomeOutputSchema,
  },
  async ({ projectId, organizationId }) => {
    // 1. Fetch the project details
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists() || projectDoc.data().organizationId !== organizationId) {
        throw new Error('Project niet gevonden of behoort niet tot deze organisatie.');
    }
    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // 2. Fetch tasks for the specific project
    const projectTasks = await searchTasks({
        organizationId: organizationId,
        filters: { projectId: projectId },
    });
    
    // 3. Fetch recent completed tasks from the organization for historical context
    const historicalTasksQuery = query(
        collection(db, 'tasks'),
        where('organizationId', '==', organizationId),
        where('status', '==', 'Voltooid'),
        orderBy('completedAt', 'desc'),
        limit(100)
    );
    const historicalSnapshot = await getDocs(historicalTasksQuery);
    const historicalTasks = historicalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    // 4. Call the LLM with the gathered data
    const { output } = await prompt({
        project: {
            name: project.name,
            deadline: project.deadline,
            budget: project.budget,
            budgetType: project.budgetType,
        },
        projectTasks,
        historicalTasks,
    });
    
    return output!;
  }
);
