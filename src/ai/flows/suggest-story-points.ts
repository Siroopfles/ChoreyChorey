'use server';
/**
 * @fileOverview AI agent that suggests story points for a task.
 */
import { ai } from '@/ai/genkit';
import { SuggestStoryPointsInputSchema, SuggestStoryPointsOutputSchema } from '@/ai/schemas';
import type { SuggestStoryPointsInput, SuggestStoryPointsOutput } from '@/ai/schemas';

export async function suggestStoryPoints(input: SuggestStoryPointsInput): Promise<SuggestStoryPointsOutput> {
  return suggestStoryPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStoryPointsPrompt',
  input: { schema: SuggestStoryPointsInputSchema },
  output: { schema: SuggestStoryPointsOutputSchema },
  model: 'gemini-pro',
  prompt: `Je bent een ervaren agile projectmanager. Jouw taak is om de complexiteit van een taak in te schatten en er een story point-waarde aan toe te kennen. Gebruik een aangepaste Fibonacci-reeks: 1, 2, 3, 5, 8, 13.

Analyseer de volgende nieuwe taak:
Titel: {{{title}}}
{{#if description}}
Omschrijving: {{{description}}}
{{/if}}

{{#if taskHistory}}
Ter referentie, hier is een lijst van recent ingeschatte taken binnen deze organisatie. Gebruik deze data om je schatting te kalibreren naar de standaarden van dit team.
---
{{#each taskHistory}}
- Taak: "{{title}}" | Punten: {{points}}
{{/each}}
---
{{/if}}

- **1 punt:** Triviale taak, zeer weinig inspanning.
- **2-3 punten:** Eenvoudige taak, weinig complexiteit.
- **5 punten:** Gemiddelde taak, enige complexiteit of onzekerheid.
- **8 punten:** Complexe taak, vereist aanzienlijke inspanning of onderzoek.
- **13 punten:** Zeer complexe taak, veel onzekerheden.

Bepaal het aantal punten voor de **nieuwe taak** en geef een korte, duidelijke redenering waarom je voor deze waarde hebt gekozen. Baseer je redenering op de complexiteit van de nieuwe taak en vergelijk deze indien mogelijk met de voorbeelden uit de geschiedenis.
`,
});

const suggestStoryPointsFlow = ai.defineFlow(
  {
    name: 'suggestStoryPointsFlow',
    inputSchema: SuggestStoryPointsInputSchema,
    outputSchema: SuggestStoryPointsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
