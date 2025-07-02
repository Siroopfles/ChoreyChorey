
'use server';
/**
 * @fileOverview An AI agent that balances a user's workload by rescheduling tasks.
 * - levelWorkload - A function that analyzes and adjusts a user's task schedule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { LevelWorkloadInputSchema, LevelWorkloadOutputSchema } from '@/ai/schemas';
import type { LevelWorkloadInput, LevelWorkloadOutput } from '@/ai/schemas';
import { searchTasks, updateTask } from '@/ai/tools/task-tools';

const promptTemplate = fs.readFileSync(path.resolve('./src/ai/prompts/level-workload.prompt'), 'utf-8');

export async function levelWorkload(input: LevelWorkloadInput): Promise<LevelWorkloadOutput> {
  return levelWorkloadFlow(input);
}

const levelWorkloadFlow = ai.defineFlow(
  {
    name: 'levelWorkloadFlow',
    inputSchema: LevelWorkloadInputSchema,
    outputSchema: LevelWorkloadOutputSchema,
  },
  async (input) => {
    // 1. Get all non-completed tasks for the user. We get all of them to allow rescheduling outside the current range.
    const existingTasks = await searchTasks({
      organizationId: input.organizationId,
      filters: { assigneeId: input.userId },
    });

    const activeTasks = existingTasks.filter(
      (task) => task.status !== 'Voltooid' && task.status !== 'Geannuleerd' && task.status !== 'Gearchiveerd'
    );

    if (activeTasks.length === 0) {
      return `Gebruiker ${input.userName} heeft geen actieve taken om te balanceren.`;
    }

    const promptText = promptTemplate
        .replaceAll('{{userName}}', input.userName)
        .replace('{{userId}}', input.userId)
        .replace('{{startDate}}', input.startDate)
        .replace('{{endDate}}', input.endDate)
        .replace('{{today}}', new Date().toISOString().split('T')[0])
        .replace('{{tasksJson}}', JSON.stringify(activeTasks, null, 2));

    // 2. Use an LLM to analyze and reschedule tasks.
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      tools: [updateTask],
      prompt: promptText,
    });

    return text;
  }
);
