'use server';

/**
 * @fileOverview AI agent that processes natural language commands.
 *
 * - processCommand - A function that processes a natural language command.
 * - ProcessCommandInput - The input type for the processCommand function.
 * - ProcessCommandOutput - The return type for the processCommand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessCommandInputSchema = z.string().describe('The natural language command from the user.');

const ProcessCommandPromptSchema = z.object({
  command: z.string(),
  currentDate: z.string(),
});

const ProcessCommandOutputSchema = z.object({
    action: z.enum(['create', 'search', 'none']).describe('The detected action: create a task, search for tasks, or no specific action.'),
    task: z.object({
        title: z.string().describe('The title of the task.'),
        description: z.string().optional().describe('The detailed description of the task.'),
        dueDate: z.string().optional().describe("The due date in 'YYYY-MM-DD' format if specified."),
        priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional().describe('The priority of the task.'),
        assignee: z.string().optional().describe('The name of the person the task is assigned to.'),
        labels: z.array(z.string()).optional().describe('A list of labels or categories for the task.')
    }).optional().describe('The details of the task to be created, if the action is "create".'),
    searchParameters: z.object({
        term: z.string().optional().describe('Any general keywords or phrases to search for in the title or description.'),
        priority: z.enum(['Laag', 'Midden', 'Hoog', 'Urgent']).optional().describe('Filter by a specific priority.'),
        assignee: z.string().optional().describe('Filter by the name of the person the task is assigned to.'),
        labels: z.array(z.string()).optional().describe('Filter by a list of labels or categories.')
    }).optional().describe('The structured search parameters, if the action is "search".'),
    reasoning: z.string().describe('A brief explanation of why this action was chosen.')
});

export type ProcessCommandInput = z.infer<typeof ProcessCommandInputSchema>;
export type ProcessCommandOutput = z.infer<typeof ProcessCommandOutputSchema>;


export async function processCommand(input: ProcessCommandInput): Promise<ProcessCommandOutput> {
  return processCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processCommandPrompt',
  input: { schema: ProcessCommandPromptSchema },
  output: { schema: ProcessCommandOutputSchema },
  prompt: `Je bent een intelligente assistent in een taakbeheer-app genaamd Chorey. Je analyseert een commando van de gebruiker en zet dit om in een gestructureerde actie.

Analyseer het volgende commando: "{{{command}}}"

Bepaal eerst de intentie van de gebruiker. Is het doel om een nieuwe taak aan te maken, of om te zoeken/filteren naar bestaande taken?

1.  **Als het commando lijkt op een taakomschrijving (bijv. "maak de badkamer schoon", "boodschappen doen voor morgen"):**
    *   Zet 'action' op 'create'.
    *   Extraheer de details en vul het 'task' object.
    *   Vandaag is {{{currentDate}}}.
    *   Geef een korte 'reasoning'.

2.  **Als het commando lijkt op een zoekopdracht of filter (bijv. "zoek naar urgente taken in de keuken", "wat doet Jan?", "planning", "wis filters"):**
    *   Zet 'action' op 'search'.
    *   Analyseer de zoekopdracht en vul het \`searchParameters\` object:
        *   Plaats algemene trefwoorden die niet in een ander veld passen in \`term\`.
        *   Extraheer \`priority\` als deze wordt genoemd.
        *   Extraheer de naam van een \`assignee\` als er naar een persoon wordt gevraagd.
        *   Extraheer \`labels\` als er categorieën worden genoemd.
    *   Als een filter niet wordt genoemd, laat het veld dan weg.
    *   Voorbeeld: "toon mij alle taken met hoge prioriteit voor de badkamer" wordt: \`{ "priority": "Hoog", "labels": ["Badkamer"] }\`.
    *   Voorbeeld: "zoek alles over 'project phoenix'" wordt: \`{ "term": "project phoenix" }\`.
    *   Voorbeeld: "wis alle filters" of "toon alles" moet een leeg \`searchParameters\` object teruggeven om de filters te resetten.
    *   Geef een korte 'reasoning'.

3.  **Als geen van bovenstaande van toepassing is:**
    *   Zet 'action' op 'none'.
    *   Geef als 'reasoning' aan waarom je het commando niet kon verwerken.

Voorbeeld taaklabels: Keuken, Woonkamer, Badkamer, Slaapkamer, Algemeen, Kantoor.
Voorbeeld prioriteiten: Laag, Midden, Hoog, Urgent.

Zorg ervoor dat de uitvoer een geldig JSON-object is dat voldoet aan het output-schema.
`,
});


const processCommandFlow = ai.defineFlow(
  {
    name: 'processCommandFlow',
    inputSchema: ProcessCommandInputSchema,
    outputSchema: ProcessCommandOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      command: input,
      currentDate: new Date().toISOString().split('T')[0],
    });
    return output!;
  }
);
