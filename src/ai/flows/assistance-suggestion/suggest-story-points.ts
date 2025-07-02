
'use server';
/**
 * @fileOverview AI agent that suggests story points for a task.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { SuggestStoryPointsInputSchema, SuggestStoryPointsOutputSchema } from '@/ai/schemas';
import type { SuggestStoryPointsInput, SuggestStoryPointsOutput } from '@/ai/schemas';
import { db } from '@/lib/core/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/suggest-story-points.prompt'), 'utf-8');

export async function suggestStoryPoints(title: string, organizationId: string, description?: string): Promise<{ output: SuggestStoryPointsOutput, input: SuggestStoryPointsInput }> {
  // RAG: Retrieve recent tasks with story points to provide context.
  const q = query(
      collection(db, 'tasks'),
      where('organizationId', '==', organizationId),
      where('storyPoints', '!=', null),
      orderBy('createdAt', 'desc'),
      limit(50) 
  );

  const snapshot = await getDocs(q);

  const taskHistory = snapshot.docs
      .map(doc => doc.data())
      .filter(data => data.status === 'Voltooid') // Filter for completed tasks
      .slice(0, 15) // Take the most recent 15
      .map(data => ({
          title: data.title,
          description: data.description,
          points: data.storyPoints,
      }));
  
  const input = { title, description, taskHistory };
  const output = await suggestStoryPointsFlow(input);
  return { output, input };
}

const prompt = ai.definePrompt({
  name: 'suggestStoryPointsPrompt',
  input: { schema: SuggestStoryPointsInputSchema },
  output: { schema: SuggestStoryPointsOutputSchema },
  model: 'gemini-pro',
  prompt: promptText,
});

const suggestStoryPointsFlow = ai.defineFlow(
  {
    name: 'suggestStoryPointsFlow',
    inputSchema: SuggestStoryPointsInputSchema,
    outputSchema: SuggestStoryPointsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
