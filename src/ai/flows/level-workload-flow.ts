'use server';
/**
 * @fileOverview An AI agent that balances a user's workload by rescheduling tasks.
 * - levelWorkload - A function that analyzes and adjusts a user's task schedule.
 */
import { ai } from '@/ai/genkit';
import { LevelWorkloadInputSchema, LevelWorkloadOutputSchema } from '@/ai/schemas';
import type { LevelWorkloadInput, LevelWorkloadOutput } from '@/ai/schemas';
import { searchTasks, updateTask } from '@/ai/tools/task-tools';

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

    // 2. Use an LLM to analyze and reschedule tasks.
    const { text } = await ai.generate({
      model: 'gemini-pro',
      tools: [updateTask],
      prompt: `Je bent een expert projectmanager die de werkdruk van een teamlid optimaliseert.
Je doel is om overbelasting op specifieke dagen te voorkomen door taken intelligent te herplannen.

CONTEXT:
- Gebruiker: ${input.userName} (ID: ${input.userId})
- Analyseperiode: ${input.startDate} tot ${input.endDate}
- Vandaag is: ${new Date().toISOString().split('T')[0]}

CAPACITEITSREGELS (per dag):
- Een gebruiker is overbelast als de totale 'storyPoints' voor die dag meer dan 8 bedragen.
- Als story points ontbreken, ga uit van: Laag=1, Midden=3, Hoog=5, Urgent=8.
- Een gebruiker is ook overbelast met meer dan 3 taken met prioriteit 'Hoog' of 'Urgent' op één dag.

TAKENLIJST (alle actieve taken voor ${input.userName}):
---
${JSON.stringify(activeTasks, null, 2)}
---

OPDRACHT:
1. Analyseer de taken met een einddatum binnen de analyseperiode.
2. Identificeer dagen waarop ${input.userName} overbelast is volgens de capaciteitsregels.
3. Als er overbelaste dagen zijn, zoek dan taken (bij voorkeur met lagere prioriteit) die je kunt verplaatsen naar een rustigere dag binnen de analyseperiode of kort daarna.
4. Gebruik de 'updateTask' tool om de 'dueDate' van de geïdentificeerde taken aan te passen. Geef de nieuwe datum op in 'YYYY-MM-DD' formaat.
5. Zorg ervoor dat je een taak niet verplaatst naar een datum die al voorbij is.
6. Formuleer een beknopte, vriendelijke samenvatting in het Nederlands van de wijzigingen die je hebt doorgevoerd.
7. Als de werkdruk al gebalanceerd is en er geen wijzigingen nodig zijn, meld dit dan ook.
8. Geef ALLEEN de samenvatting als antwoord.
`,
    });

    return text;
  }
);
