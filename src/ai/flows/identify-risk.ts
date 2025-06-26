'use server';
/**
 * @fileOverview An AI agent that identifies potential risks in a task.
 * - identifyRisk - A function that analyzes a task for risks.
 */

import { ai } from '@/ai/genkit';
import { IdentifyRiskInputSchema, IdentifyRiskOutputSchema } from '@/ai/schemas';
import type { IdentifyRiskInput, IdentifyRiskOutput } from '@/ai/schemas';

export async function identifyRisk(input: IdentifyRiskInput): Promise<IdentifyRiskOutput> {
  return identifyRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRiskPrompt',
  input: { schema: IdentifyRiskInputSchema },
  output: { schema: IdentifyRiskOutputSchema },
  model: 'gemini-pro',
  prompt: `Je bent een risico-analist voor projectmanagement. Jouw taak is om een taakomschrijving te analyseren en potentiële risico's te identificeren.

Analyseer de volgende taak:
Titel: {{{title}}}
{{#if description}}
Omschrijving: {{{description}}}
{{/if}}

Zoek naar sleutelwoorden en concepten die duiden op onzekerheid, afhankelijkheden, complexiteit, of mogelijke problemen. Voorbeelden zijn: "misschien", "afhankelijk van", "complex", "nieuw", "nog nooit gedaan", "moeilijk", "onduidelijk", "onderzoeken", "externe partij".

- Bepaal of er een significant risico aanwezig is (\`hasRisk\`).
- Schat het risiconiveau in als "Laag", "Midden", of "Hoog".
- Geef een beknopte \`analysis\` van de gevonden risico's of waarom er geen risico is.

Voorbeeld:
Titel: "Nieuwe betaalprovider integreren"
Omschrijving: "We moeten de API van een nieuwe, onbekende betaalprovider integreren. Dit is complex en we hebben dit nog nooit eerder gedaan."
Output: { "hasRisk": true, "riskLevel": "Hoog", "analysis": "De taak omvat het werken met een nieuwe, onbekende technologie ('onbekende betaalprovider') en wordt expliciet als 'complex' en 'nog nooit eerder gedaan' omschreven. Dit duidt op een hoog technisch risico en planningsonzekerheid." }
`,
});

const identifyRiskFlow = ai.defineFlow(
  {
    name: 'identifyRiskFlow',
    inputSchema: IdentifyRiskInputSchema,
    outputSchema: IdentifyRiskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
