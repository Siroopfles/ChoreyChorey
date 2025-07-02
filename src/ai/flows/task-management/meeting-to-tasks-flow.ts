
'use server';
/**
 * @fileOverview An AI agent that processes meeting notes and creates tasks.
 * - meetingToTasks - A function that handles the meeting notes processing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai, googleAI } from '@/ai/genkit';
import { MeetingToTasksInputSchema, MeetingToTasksOutputSchema } from '@/ai/schemas';
import type { MeetingToTasksInput, MeetingToTasksOutput } from '@/ai/schemas';
import { createTask } from '@/ai/tools/task-tools';
import { getUsers } from '@/ai/tools/user-tools';

const promptTemplate = fs.readFileSync(path.resolve('./src/ai/prompts/meeting-to-tasks.prompt'), 'utf-8');

export async function meetingToTasks(input: Omit<MeetingToTasksInput, 'currentDate'>): Promise<MeetingToTasksOutput> {
  const augmentedInput: MeetingToTasksInput = {
    ...input,
    currentDate: new Date().toISOString().split('T')[0],
  };
  return meetingToTasksFlow(augmentedInput);
}

const meetingToTasksFlow = ai.defineFlow(
  {
    name: 'meetingToTasksFlow',
    inputSchema: MeetingToTasksInputSchema,
    outputSchema: MeetingToTasksOutputSchema,
  },
  async (input) => {
    const promptText = promptTemplate
      .replace('{{notes}}', input.notes)
      .replace('{{currentDate}}', input.currentDate)
      .replace('{{organizationId}}', input.organizationId)
      .replace('{{creatorId}}', input.creatorId);

    const { text } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      tools: [createTask, getUsers],
      prompt: promptText,
    });
    return text;
  }
);
