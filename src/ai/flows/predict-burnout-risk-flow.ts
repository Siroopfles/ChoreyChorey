'use server';
/**
 * @fileOverview An AI agent that predicts potential burnout risk for a user.
 * - predictBurnoutRisk - A function that analyzes a user's workload and patterns.
 */
import { ai } from '@/ai/genkit';
import { PredictBurnoutRiskInputSchema, PredictBurnoutRiskOutputSchema } from '@/ai/schemas';
import type { PredictBurnoutRiskInput, PredictBurnoutRiskOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { z } from 'genkit';

export async function predictBurnoutRisk(input: PredictBurnoutRiskInput): Promise<PredictBurnoutRiskOutput> {
  return predictBurnoutRiskFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictBurnoutRiskPrompt',
    input: { schema: z.object({ userName: z.string(), tasks: z.any(), workingHours: z.any().optional() }) },
    output: { schema: PredictBurnoutRiskOutputSchema },
    model: 'gemini-pro',
    prompt: `Je bent een ervaren HR-analist en teammanager, gespecialiseerd in het welzijn van medewerkers en het voorkomen van burn-outs. Jouw taak is om de werkdruk en -patronen van een gebruiker te analyseren en een inschatting te maken van hun burn-outrisico.

Gebruiker: {{{userName}}}

Analyseer de volgende data:
1.  **Actieve Takenlijst:** Een JSON-lijst van alle taken die momenteel aan de gebruiker zijn toegewezen en nog niet voltooid zijn. Let op de hoeveelheid, de prioriteit ('Urgent', 'Hoog'), en de story points (een maat voor complexiteit).
    \`\`\`json
    {{{json tasks}}}
    \`\`\`
2.  **Werkuren (indien beschikbaar):** De geconfigureerde werkuren van de gebruiker.
    {{#if workingHours}}
    - Starttijd: {{workingHours.startTime}}
    - Eindtijd: {{workingHours.endTime}}
    {{else}}
    - Standaard (09:00 - 17:00)
    {{/if}}

**Analyseer op de volgende risicofactoren:**
-   **Structurele overbelasting:** Een constant hoog aantal taken of story points.
-   **Hoge druk:** Een onevenredig groot aantal 'Urgent' of 'Hoog' geprioriteerde taken.
-   **Versnipperd werk:** Veel kleine taken, wat kan leiden tot constant context-switchen.
-   **Langdurige inzet op complexe taken:** Meerdere taken met hoge story points (8+).
-   **Onrealistische deadlines:** Veel taken die op dezelfde dag of binnen een korte periode moeten worden afgerond (vergelijk 'dueDate').

**Jouw taken:**
1.  **Beoordeel het risico:** Evalueer de data en bepaal of de gebruiker een risico loopt op een burn-out (\`isAtRisk\`).
2.  **Kwantificeer het risico:** Stel het risiconiveau (\`riskLevel\`) vast als 'Geen', 'Laag', 'Midden', of 'Hoog'.
3.  **Geef een gedetailleerde Redenering (\`reasoning\`):** Leg je analyse uit. Wees specifiek. Bijvoorbeeld: "Het risico is 'Midden' omdat {{userName}} 5 taken met prioriteit 'Hoog' heeft, waarvan 3 op dezelfde dag moeten worden afgerond, wat duidt op een aankomende piekbelasting. Daarnaast zijn er 2 complexe taken (8+ story points) tegelijkertijd actief."
4.  **Geef concrete Suggesties (\`suggestions\`):** Formuleer 2-3 bruikbare, proactieve suggesties voor een manager om het risico te verminderen. Bijvoorbeeld: "Overweeg om de taak 'X' te herprioriteren of opnieuw toe te wijzen.", "Bespreek de werkdruk met {{userName}} en moedig een pauze aan.", "Stel voor om complexe taak 'Y' op te splitsen in kleinere subtaken."
`,
});


const predictBurnoutRiskFlow = ai.defineFlow(
  {
    name: 'predictBurnoutRiskFlow',
    inputSchema: PredictBurnoutRiskInputSchema,
    outputSchema: PredictBurnoutRiskOutputSchema,
  },
  async (input) => {
    // 1. Get all non-completed tasks for the user.
    const existingTasks = await searchTasks({
      organizationId: input.organizationId,
      filters: { assigneeId: input.userId },
    });
    
    const activeTasks = existingTasks.filter(
      (task) => task.status !== 'Voltooid' && task.status !== 'Geannuleerd' && task.status !== 'Gearchiveerd'
    );
    
    // 2. Get user's working hours
    const userDoc = await getDoc(doc(db, 'users', input.userId));
    const workingHours = userDoc.exists() ? (userDoc.data() as User).workingHours : undefined;

    // 3. Call the LLM with the gathered data
    const { output } = await prompt({
        userName: input.userName,
        tasks: activeTasks,
        workingHours: workingHours,
    });
    
    return output!;
  }
);
