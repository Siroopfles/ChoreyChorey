'use server';
/**
 * @fileOverview An AI agent that checks for duplicate tasks.
 * - findDuplicateTask - A function that analyzes a new task for potential duplicates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { FindDuplicateTaskInputSchema, FindDuplicateTaskOutputSchema } from '@/ai/schemas';
import type { FindDuplicateTaskInput, FindDuplicateTaskOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/find-duplicate-task.prompt'), 'utf-8');

export async function findDuplicateTask(input: FindDuplicateTaskInput): Promise<{ output: FindDuplicateTaskOutput, input: FindDuplicateTaskInput }> {
  const output = await findDuplicateTaskFlow(input);
  return { output, input };
}

const findDuplicateTaskFlow = ai.defineFlow(
  {
    name: 'findDuplicateTaskFlow',
    inputSchema: FindDuplicateTaskInputSchema,
    outputSchema: FindDuplicateTaskOutputSchema,
  },
  async (input) => {
    // To make this more efficient, we fetch tasks for each "active" status separately.
    // This avoids fetching all tasks (including completed/archived) from the database.
    const activeStatuses = ['Te Doen', 'In Uitvoering', 'In Review'];
    
    const searchPromises = activeStatuses.map(status => 
        searchTasks({
            organizationId: input.organizationId,
            filters: { status: status, term: input.title },
        })
    );
    
    const resultsPerStatus = await Promise.all(searchPromises);
    const activeTasks = resultsPerStatus.flat();

    if (activeTasks.length === 0) {
      return {
        isDuplicate: false,
        reasoning: 'Geen vergelijkbare actieve taken gevonden.',
        duplicateTaskId: undefined,
        duplicateTaskTitle: undefined
      };
    }
    
    // Use an LLM to determine if there's a semantic duplicate.
    const { output } = await ai.generate({
      model: 'gemini-pro',
      output: { schema: FindDuplicateTaskOutputSchema },
      prompt: promptText,
      context: {
        title: input.title,
        description: input.description || 'Geen omschrijving',
        activeTasks,
      },
    });

    return output!;
  }
);
