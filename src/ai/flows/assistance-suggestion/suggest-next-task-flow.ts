
'use server';
/**
 * @fileOverview An AI agent that suggests the best next task for a user to work on.
 * - suggestNextTask - A function that handles the suggestion process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { SuggestNextTaskInputSchema, SuggestNextTaskOutputSchema } from '@/ai/schemas';
import type { SuggestNextTaskInput, SuggestNextTaskOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-next-task.prompt'), 'utf-8');

export async function suggestNextTask(input: SuggestNextTaskInput): Promise<SuggestNextTaskOutput> {
  return suggestNextTaskFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestNextTaskPrompt',
    input: { schema: z.object({ userName: z.string(), tasks: z.any(), currentDate: z.string() }) },
    output: { schema: SuggestNextTaskOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: promptText,
});


const suggestNextTaskFlow = ai.defineFlow(
  {
    name: 'suggestNextTaskFlow',
    inputSchema: SuggestNextTaskInputSchema,
    outputSchema: SuggestNextTaskOutputSchema,
  },
  async ({ userId, userName, organizationId }) => {
    // 1. Get all active tasks for the user.
    const tasks = await searchTasks({
      organizationId,
      filters: { assigneeId: userId },
    });
    
    const activeTasks = tasks.filter(
      (task) => task.status !== 'Voltooid' && task.status !== 'Geannuleerd' && task.status !== 'Gearchiveerd'
    );
    
    // 2. Call the LLM with the gathered data
    const { output } = await prompt({
        userName,
        tasks: activeTasks,
        currentDate: new Date().toISOString().split('T')[0],
    });
    
    if (!output) {
      throw new Error("De AI kon geen volgende taak suggereren.");
    }

    return output;
  }
);
