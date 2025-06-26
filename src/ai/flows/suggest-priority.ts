'use server';
/**
 * @fileOverview AI agent that suggests a priority for a task.
 */
import { ai } from '@/ai/genkit';
import { SuggestPriorityInputSchema, SuggestPriorityOutputSchema } from '@/ai/schemas';
import type { SuggestPriorityInput, SuggestPriorityOutput } from '@/ai/schemas';

export async function suggestPriority(input: SuggestPriorityInput): Promise<SuggestPriorityOutput> {
  return suggestPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPriorityPrompt',
  input: { schema: SuggestPriorityInputSchema },
  output: { schema: SuggestPriorityOutputSchema },
  model: 'gemini-pro',
  prompt: `Je bent een ervaren projectmanager. Jouw taak is om de urgentie en belangrijkheid van een taak te bepalen en een prioriteit toe te kennen. De mogelijke prioriteiten zijn: "Laag", "Midden", "Hoog", "Urgent".

Analyseer de volgende taak:
Titel: {{{title}}}
{{#if description}}
Omschrijving: {{{description}}}
{{/if}}

- **Urgent:** Moet onmiddellijk worden opgepakt. Blokkert andere kritieke taken of heeft een zeer nabije, harde deadline.
- **Hoog:** Belangrijke taak die zo snel mogelijk moet worden afgerond.
- **Midden:** Standaardtaak die binnen de normale workflow past.
- **Laag:** Taak die kan wachten, nice-to-have, of heeft geen directe impact.

Let op woorden die duiden op tijdgevoeligheid (bv. "meteen", "dringend", "deadline", "geblokkeerd") of impact (bv. "kritiek", "belangrijk", "fout").

Bepaal de juiste prioriteit en geef een korte, duidelijke redenering waarom je voor deze waarde hebt gekozen.
`,
});

const suggestPriorityFlow = ai.defineFlow(
  {
    name: 'suggestPriorityFlow',
    inputSchema: SuggestPriorityInputSchema,
    outputSchema: SuggestPriorityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
