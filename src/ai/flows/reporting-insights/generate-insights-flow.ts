'use server';
/**
 * @fileOverview An AI agent that analyzes organization data to find insights and trends.
 * - generateInsights - A function that handles the insight generation process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { GenerateInsightsInputSchema, GenerateInsightsOutputSchema } from '@/ai/schemas';
import type { GenerateInsightsInput, GenerateInsightsOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { getUsers } from '@/ai/tools/user-tools';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/core/firebase';
import type { Team } from '@/lib/types';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/generate-insights.prompt'), 'utf-8');

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateInsightsPrompt',
    input: { schema: z.object({ allTasks: z.any(), allUsers: z.any(), allTeams: z.any() }) },
    output: { schema: GenerateInsightsOutputSchema },
    model: 'gemini-pro',
    prompt: promptText,
});


const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async ({ organizationId }) => {
    // 1. Get all tasks
    const allTasks = await searchTasks({ organizationId, filters: {} });
    
    // 2. Get all users
    const allUsers = await getUsers({ organizationId });
    
    // 3. Get all teams
    const teamsQuery = query(collection(db, 'teams'), where('organizationId', '==', organizationId));
    const teamsSnapshot = await getDocs(teamsQuery);
    const allTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

    if (allTasks.length < 10) {
      return {
        insights: [{
          category: 'Data',
          title: 'Onvoldoende Data',
          finding: 'Er zijn nog niet genoeg taken in de organisatie om een betekenisvolle analyse uit te voeren. Ga door met het gebruiken van de app!',
          evidence: `Slechts ${allTasks.length} taken gevonden.`,
        }]
      };
    }
    
    // 4. Call the LLM with the gathered data
    const { output } = await prompt({
        allTasks,
        allUsers,
        allTeams,
    });
    
    if (!output) {
      throw new Error("De AI kon geen inzichten genereren.");
    }

    return output;
  }
);
