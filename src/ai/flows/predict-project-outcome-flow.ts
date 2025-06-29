
'use server';
/**
 * @fileOverview An AI agent that predicts project outcomes based on current progress and historical data.
 * - predictProjectOutcome - A function that handles the project outcome prediction process.
 */
import { ai } from '@/ai/genkit';
import { PredictProjectOutcomeInputSchema, PredictProjectOutcomeOutputSchema } from '@/ai/schemas';
import type { PredictProjectOutcomeInput, PredictProjectOutcomeOutput } from '@/ai/schemas';
import { searchTasks } from '@/ai/tools/task-tools';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Task } from '@/lib/types';
import { z } from 'genkit';


export async function predictProjectOutcome(input: PredictProjectOutcomeInput): Promise<PredictProjectOutcomeOutput> {
  return predictProjectOutcomeFlow(input);
}

const prompt = ai.definePrompt({
    name: 'predictProjectOutcomePrompt',
    input: { schema: z.object({ 
        project: z.any(),
        projectTasks: z.any(),
        historicalTasks: z.any(),
    }) },
    output: { schema: PredictProjectOutcomeOutputSchema },
    model: 'gemini-pro',
    prompt: `Je bent een expert projectanalist. Jouw taak is om de voortgang van een project te analyseren, te vergelijken met historische data en een voorspelling te doen over de uitkomst.

**Projectinformatie:**
- Naam: {{{project.name}}}
{{#if project.deadline}}
- Deadline: {{{project.deadline}}}
{{else}}
- Deadline: Geen ingesteld
{{/if}}
{{#if project.budget}}
- Budget: {{project.budget}} ({{project.budgetType}})
{{/if}}

**Huidige Taken van dit Project:**
---
{{{json projectTasks}}}
---

**Historische Data (Referentietaken uit de organisatie):**
---
{{{json historicalTasks}}}
---

**Jouw Analyse & Voorspelling:**

1.  **Bereken de Voortgang & Snelheid (Velocity):** Analyseer de voltooide taken binnen het project en de historische data om de gemiddelde snelheid van het team in te schatten (bv. aantal taken/story points per week).
2.  **Voorspel de Voltooiingsdatum:** Gebruik de berekende snelheid en de hoeveelheid resterend werk (openstaande taken) om een \`predictedCompletionDate\` (in JJJJ-MM-DD formaat) te schatten.
3.  **Beoordeel de Status (\`onTrackStatus\`):**
    -   **ON_TRACK:** Als de voorspelde datum ruim voor de deadline ligt en het budgetgebruik in lijn is met de voortgang.
    -   **AT_RISK:** Als de voorspelde datum dicht bij of net na de deadline ligt, of als het budget krap wordt.
    -   **OFF_TRACK:** Als de voorspelde datum de deadline significant overschrijdt, of als het budget al (bijna) is opgebruikt terwijl er nog veel werk is.
4.  **Voorspel het Budget (\`budgetPrediction\`):** Analyseer de kosten van voltooide taken versus het totale budget. Voorspel of het project binnen, op of over het budget zal eindigen.
5.  **Geef een Vertrouwensscore (\`confidenceScore\`):** Geef een score van 0-100 die aangeeft hoe zeker je bent van je voorspelling, gebaseerd op de hoeveelheid en kwaliteit van de beschikbare data.
6.  **Geef een gedetailleerde Redenering (\`reasoning\`):** Leg uit hoe je tot je conclusie bent gekomen. Vermeld de berekende snelheid, de belangrijkste risico's (bv. veel openstaande complexe taken, een naderende deadline) en de factoren die je analyse hebben beïnvloed.
7.  **Geef concrete Aanbevelingen (\`recommendations\`):** Formuleer 2-3 bruikbare, proactieve suggesties om risico's te verminderen. Voorbeelden: "Herzie de prioriteit van taak X", "Overweeg taak Y op te splitsen", "Wijs extra resources toe aan...", "Plan een risicobeoordeling voor...".
`,
});

const predictProjectOutcomeFlow = ai.defineFlow(
  {
    name: 'predictProjectOutcomeFlow',
    inputSchema: PredictProjectOutcomeInputSchema,
    outputSchema: PredictProjectOutcomeOutputSchema,
  },
  async ({ projectId, organizationId }) => {
    // 1. Fetch the project details
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists() || projectDoc.data().organizationId !== organizationId) {
        throw new Error('Project niet gevonden of behoort niet tot deze organisatie.');
    }
    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // 2. Fetch tasks for the specific project
    const projectTasks = await searchTasks({
        organizationId: organizationId,
        filters: { projectId: projectId },
    });
    
    // 3. Fetch recent completed tasks from the organization for historical context
    const historicalTasksQuery = query(
        collection(db, 'tasks'),
        where('organizationId', '==', organizationId),
        where('status', '==', 'Voltooid'),
        orderBy('completedAt', 'desc'),
        limit(100)
    );
    const historicalSnapshot = await getDocs(historicalTasksQuery);
    const historicalTasks = historicalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    // 4. Call the LLM with the gathered data
    const { output } = await prompt({
        project: {
            name: project.name,
            deadline: project.deadline,
            budget: project.budget,
            budgetType: project.budgetType,
        },
        projectTasks,
        historicalTasks,
    });
    
    return output!;
  }
);

    