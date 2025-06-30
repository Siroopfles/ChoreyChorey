
'use server';

/**
 * @fileOverview An AI agent that processes natural language commands using tools.
 *
 * - processCommand - A function that processes a natural language command.
 * - ProcessCommandInput - The input type for the processCommand function.
 * - ProcessCommandOutput - The return type for the processCommand function.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { ProcessCommandInputSchema, ProcessCommandOutputSchema } from '@/ai/schemas';
import type { ProcessCommandInput, ProcessCommandOutput } from '@/ai/schemas';
import { createTask, searchTasks, updateTask } from '@/ai/tools/task-tools';
import { getUsers } from '@/ai/tools/user-tools';

const promptTemplate = fs.readFileSync(path.resolve('./src/ai/prompts/process-command.prompt'), 'utf-8');

export async function processCommand(input: Omit<ProcessCommandInput, 'currentDate'>): Promise<ProcessCommandOutput> {
  const augmentedInput: ProcessCommandInput = {
    ...input,
    currentDate: new Date().toISOString().split('T')[0],
  };
  return processCommandFlow(augmentedInput);
}

const processCommandFlow = ai.defineFlow(
  {
    name: 'processCommandFlow',
    inputSchema: ProcessCommandInputSchema,
    outputSchema: ProcessCommandOutputSchema,
  },
  async (input) => {
    const promptText = promptTemplate
      .replace('{{currentDate}}', input.currentDate)
      .replace('{{userName}}', input.userName)
      .replace('{{userId}}', input.userId)
      .replace('{{organizationId}}', input.organizationId)
      .replace('{{command}}', input.command);

    const { text } = await ai.generate({
      model: 'gemini-pro',
      tools: [createTask, searchTasks, updateTask, getUsers],
      prompt: promptText,
    });
    return text;
  }
);
