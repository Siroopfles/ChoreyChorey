
'use server';
/**
 * @fileOverview An AI agent that analyzes 'what-if' scenarios for projects.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai, googleAI } from '@/ai/genkit';
import { WhatIfScenarioInputSchema, WhatIfScenarioOutputSchema } from '@/ai/schemas';
import type { WhatIfScenarioInput, WhatIfScenarioOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Project, Task } from '@/lib/types';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/what-if-scenario.prompt'), 'utf-8');

export async function analyzeWhatIfScenario(input: WhatIfScenarioInput): Promise<WhatIfScenarioOutput> {
  return whatIfScenarioFlow(input);
}

const prompt = ai.definePrompt({
    name: 'whatIfScenarioPrompt',
    input: { schema: z.object({
        project: z.any(),
        projectTasks: z.any(),
        scenarioDescription: z.string(),
    })},
    output: { schema: WhatIfScenarioOutputSchema },
    model: googleAI.model('gemini-1.5-flash-latest'),
    prompt: promptText,
});

const whatIfScenarioFlow = ai.defineFlow(
  {
    name: 'whatIfScenarioFlow',
    inputSchema: WhatIfScenarioInputSchema,
    outputSchema: WhatIfScenarioOutputSchema,
  },
  async ({ projectId, organizationId, scenarioDescription }) => {
    // 1. Fetch project details
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists() || projectDoc.data().organizationId !== organizationId) {
        throw new Error('Project niet gevonden of behoort niet tot deze organisatie.');
    }
    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // 2. Fetch tasks for the project
    const projectTasks = await searchTasks({
        organizationId,
        filters: { projectId },
    });
    
    // 3. Call the LLM with the gathered context and scenario
    const { output } = await prompt({
        project: {
            name: project.name,
            deadline: project.deadline,
            budget: project.budget,
            budgetType: project.budgetType,
        },
        projectTasks,
        scenarioDescription,
    });
    
    if (!output) {
        throw new Error("De AI kon geen analyse genereren.");
    }

    return output;
  }
);
