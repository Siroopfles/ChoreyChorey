'use server';
/**
 * @fileOverview An AI agent that checks for duplicate tasks.
 * - findDuplicateTask - A function that analyzes a new task for potential duplicates.
 */
import { ai } from '@/ai/genkit';
import { FindDuplicateTaskInputSchema, FindDuplicateTaskOutputSchema } from '@/ai/schemas';
import type { FindDuplicateTaskInput, FindDuplicateTaskOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';

export async function findDuplicateTask(input: FindDuplicateTaskInput): Promise<FindDuplicateTaskOutput> {
  return findDuplicateTaskFlow(input);
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
      };
    }
    
    // Use an LLM to determine if there's a semantic duplicate.
    const { output } = await ai.generate({
      model: 'gemini-pro',
      output: { schema: FindDuplicateTaskOutputSchema },
      prompt: `Je bent een AI-assistent die dubbele taken detecteert in een taakbeheersysteem. Analyseer de nieuwe taak en vergelijk deze met de lijst van bestaande actieve taken. Een taak wordt als duplicaat beschouwd als deze semantisch hetzelfde doel heeft, zelfs als de bewoording anders is.

Nieuwe taak:
Titel: ${input.title}
Omschrijving: ${input.description || 'Geen omschrijving'}

Bestaande actieve taken:
---
${JSON.stringify(activeTasks, null, 2)}
---

Analyseer de lijst en bepaal of de nieuwe taak een duplicaat is van een van de bestaande taken.
- Als er een duplicaat is, zet \`isDuplicate\` op true, geef de \`duplicateTaskId\` en \`duplicateTaskTitle\` van de MEEST waarschijnlijke duplicaat en leg uit waarom.
- Als er geen duplicaat is, zet \`isDuplicate\` op false en leg kort uit waarom niet.
`,
    });

    return output!;
  }
);
