'use server';
/**
 * @fileOverview An AI agent that processes meeting notes and creates tasks.
 * - meetingToTasks - A function that handles the meeting notes processing.
 */
import { ai } from '@/ai/genkit';
import { MeetingToTasksInputSchema, MeetingToTasksOutputSchema } from '@/ai/schemas';
import type { MeetingToTasksInput, MeetingToTasksOutput } from '@/ai/schemas';
import { createTask, getUsers } from '@/ai/tools/task-tools';

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
    const { text } = await ai.generate({
      model: 'gemini-pro',
      tools: [createTask, getUsers],
      prompt: `Je bent een AI-assistent die notulen van vergaderingen analyseert en omzet in uitvoerbare taken in de Chorey-app.

Analyseer de volgende notulen:
---
${input.notes}
---

Jouw taken:
1.  Identificeer alle concrete actiepunten. Een actiepunt bevat een duidelijke taak en vaak een verantwoordelijke persoon (bv. "Jan moet de presentatie voorbereiden").
2.  Voor elk actiepunt, gebruik de \`createTask\` tool om een nieuwe taak aan te maken.
3.  Als er een naam wordt genoemd, gebruik dan de \`getUsers\` tool om de bijbehorende gebruikers-ID te vinden en wijs de taak toe via \`assigneeIds\`. Als je geen gebruiker kunt vinden, maak de taak dan zonder toegewezene aan.
4.  Probeer een redelijke prioriteit en deadline af te leiden uit de tekst (bv. "zo snel mogelijk", "eind deze week"). Gebruik de huidige datum (${input.currentDate}) als referentie. Als er geen duidelijke deadline is, laat je die leeg.
5.  Gebruik de \`organizationId\` '${input.organizationId}' en \`creatorId\` '${input.creatorId}' voor elke taak die je aanmaakt.
6.  Formuleer tot slot een beknopt, vriendelijk en informatief antwoord in het Nederlands dat samenvat wat je hebt gedaan. Bijvoorbeeld: "Oké, ik heb 3 taken aangemaakt: 'Presentatie voorbereiden' toegewezen aan Jan, 'Cijfers analyseren' en 'Feedback verzamelen'."
7.  Geef ALLEEN de samenvatting als antwoord.`,
    });
    return text;
  }
);