
'use server';

/**
 * @fileOverview An AI agent that processes natural language commands using tools.
 *
 * - processCommand - A function that processes a natural language command.
 * - ProcessCommandInput - The input type for the processCommand function.
 * - ProcessCommandOutput - The return type for the processCommand function.
 */

import { ai } from '@/ai/genkit';
import { ProcessCommandInputSchema, ProcessCommandOutputSchema } from '@/ai/schemas';
import type { ProcessCommandInput, ProcessCommandOutput } from '@/ai/schemas';
import { createTask, searchTasks, updateTask, getUsers } from '@/ai/tools/task-tools';

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
    const { text } = await ai.generate({
      model: 'gemini-pro',
      tools: [createTask, searchTasks, updateTask, getUsers],
      prompt: `Je bent een AI-assistent in de taakbeheer-app Chorey. Je helpt gebruikers hun taken te beheren door middel van natuurlijke taal. Gebruik de beschikbare tools om hun verzoeken uit te voeren.

Belangrijke context:
- Vandaag is het: ${input.currentDate}.
- De gebruiker die dit commando uitvoert is '${input.userName}' (ID: ${input.userId}). Als ze "ik" of "mij" zeggen, verwijst dat naar deze gebruiker.
- Alle acties moeten binnen de organisatie met ID '${input.organizationId}' worden uitgevoerd.

Werkwijze:
1. Analyseer het verzoek van de gebruiker: "${input.command}".
2. Bepaal welke tool(s) je nodig hebt om het verzoek te voltooien. Je kunt meerdere tools achter elkaar gebruiken.
3. Als je gebruikersinformatie nodig hebt (bijv. "zoek taken voor Jan"), gebruik dan eerst de \`getUsers\` tool om de ID van de gebruiker te vinden.
4. Voer de tools uit met de juiste parameters.
5. Formuleer een beknopt, vriendelijk en informatief antwoord in het Nederlands dat samenvat wat je hebt gedaan of gevonden. Bijvoorbeeld: "Oké, ik heb de taak 'Badkamer schoonmaken' aangemaakt." of "Ik heb 3 taken gevonden die aan jou zijn toegewezen."
6. Als je een verzoek niet kunt verwerken, leg dan vriendelijk uit waarom.`,
    });
    return text;
  }
);
