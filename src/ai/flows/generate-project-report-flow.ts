'use server';
/**
 * @fileOverview An AI agent that generates a project status report.
 * - generateProjectReport - A function that handles the project report generation process.
 */
import { ai } from '@/ai/genkit';
import { GenerateProjectReportInputSchema, GenerateProjectReportOutputSchema } from '@/ai/schemas';
import type { GenerateProjectReportInput, GenerateProjectReportOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { z } from 'genkit';

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateProjectReportPrompt',
    input: { schema: z.object({ projectName: z.string(), tasks: z.any() }) },
    output: { schema: GenerateProjectReportOutputSchema },
    model: 'gemini-pro',
    prompt: `Je bent een ervaren projectcoördinator. Jouw taak is om een gedetailleerd en professioneel voortgangsrapport op te stellen voor het project "{{{projectName}}}".

Analyseer de volgende lijst met taken die bij dit project horen. De data is in JSON-formaat.
---
{{{json tasks}}}
---

Stel een rapport op in Markdown-formaat. Het rapport moet de volgende secties bevatten:

### Samenvatting
Een korte, algehele samenvatting van de projectstatus.

### Voortgangsstatistieken
-   Totaal aantal taken.
-   Taken voltooid, in uitvoering, te doen, etc. (geef percentages).

### Belangrijke Prestaties
Lijst van recent voltooide taken die significant zijn.

### Aankomende Mijlpalen
Lijst van belangrijke taken met een naderende deadline.

### Risico's en Knelpunten
-   Identificeer taken die te laat zijn (overdue).
-   Identificeer taken met hoge prioriteit die nog niet zijn gestart.
-   Wijs op mogelijke knelpunten waar veel taken op één persoon of status wachten.

Schrijf het rapport in het Nederlands. Wees beknopt maar informatief.
`,
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
