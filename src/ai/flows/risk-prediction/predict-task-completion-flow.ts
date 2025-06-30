'use server';
/**
 * @fileOverview An AI agent that predicts the completion date of a task.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { PredictTaskCompletionInputSchema, PredictTaskCompletionOutputSchema } from '@/ai/schemas';
import type { PredictTaskCompletionInput, PredictTaskCompletionOutput } from '@/ai/schemas';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { z } from 'genkit';
import type { Task } from '@/lib/types';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/predict-task-completion.prompt'), 'utf-8');

export async function predictTaskCompletion(input: PredictTaskCompletionInput): Promise<PredictTaskCompletionOutput> {
  return predictTaskCompletionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictTaskCompletionPrompt',
    input: { schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.string(),
        storyPoints: z.number().optional().nullable(),
        historicalTasks: z.any(),
        currentDate: z.string(),
    }) },
    output: { schema: PredictTaskCompletionOutputSchema },
    model: 'gemini-pro',
    prompt: promptText,
});


const predictTaskCompletionFlow = ai.defineFlow(
  {
    name: 'predictTaskCompletionFlow',
    inputSchema: PredictTaskCompletionInputSchema,
    outputSchema: PredictTaskCompletionOutputSchema,
  },
  async (input) => {
    // RAG: Retrieve recent tasks to provide context.
    const q = query(
        collection(db, 'tasks'),
        where('organizationId', '==', input.organizationId),
        where('status', '==', 'Voltooid'),
        where('completedAt', '!=', null),
        where('createdAt', '!=', null),
        orderBy('completedAt', 'desc'),
        limit(50) 
    );
    const snapshot = await getDocs(q);

    const historicalTasks = snapshot.docs
        .map(doc => {
            const data = doc.data() as Task;
            return {
                title: data.title,
                priority: data.priority,
                storyPoints: data.storyPoints,
                // Calculate duration in days
                durationDays: Math.ceil(((data.completedAt as Date).getTime() - (data.createdAt as Date).getTime()) / (1000 * 60 * 60 * 24)),
            };
        });
    
    const { output } = await prompt({
        title: input.title,
        description: input.description,
        priority: input.priority,
        storyPoints: input.storyPoints,
        historicalTasks,
        currentDate: new Date().toISOString().split('T')[0],
    });
    
    return output!;
  }
);
