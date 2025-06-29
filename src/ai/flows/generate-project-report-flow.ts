'use server';
/**
 * @fileOverview An AI agent that generates a project status report.
 * - generateProjectReport - A function that handles the project report generation process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ai } from '@/ai/genkit';
import { GenerateProjectReportInputSchema, GenerateProjectReportOutputSchema } from '@/ai/schemas';
import type { GenerateProjectReportInput, GenerateProjectReportOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { z } from 'genkit';

const promptText = fs.readFileSync(path.resolve('./src/ai/prompts/generate-project-report.prompt'), 'utf-8');

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateProjectReportPrompt',
    input: { schema: z.object({ projectName: z.string(), tasks: z.any() }) },
    output: { schema: GenerateProjectReportOutputSchema },
    model: 'gemini-pro',
    prompt: promptText,
});


const generateProjectReportFlow = ai.defineFlow(
  {
    name: 'generateProjectReportFlow',
    inputSchema: GenerateProjectReportInputSchema,
    outputSchema: GenerateProjectReportOutputSchema,
  },
  async (input) => {
    // 1. Get all tasks for the project
    const projectTasks = await searchTasks({
      organizationId: input.organizationId,
      filters: { projectId: input.projectId },
    });

    if (projectTasks.length === 0) {
        return { report: `### Rapport voor ${input.projectName}\n\nEr zijn geen taken gevonden voor dit project.` };
    }

    // 2. Call the LLM with the gathered data
    const { output } = await prompt({
        projectName: input.projectName,
        tasks: projectTasks,
    });
    
    return output!;
  }
);
