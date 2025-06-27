'use server';
/**
 * @fileOverview An AI agent for suggesting project headcount and team composition.
 * - suggestHeadcount - A function that analyzes a project description to suggest headcount.
 */

import {ai} from '@/ai/genkit';
import { SuggestHeadcountInputSchema, SuggestHeadcountOutputSchema } from '@/ai/schemas';
import type { SuggestHeadcountInput, SuggestHeadcountOutput } from '@/ai/schemas';

export async function suggestHeadcount(input: SuggestHeadcountInput): Promise<SuggestHeadcountOutput> {
  return suggestHeadcountFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHeadcountPrompt',
  input: {schema: SuggestHeadcountInputSchema},
  output: {schema: SuggestHeadcountOutputSchema},
  model: 'gemini-pro',
  prompt: `Je bent een ervaren resource manager en projectplanner. Jouw taak is om op basis van een projectomschrijving en een lijst van beschikbare medewerkers een optimale teamsamenstelling en personeelsbehoefte (headcount) voor te stellen.

Analyseer de volgende projectomschrijving:
---
{{{projectDescription}}}
---

Houd rekening met de volgende beschikbare medewerkers, hun rollen en vaardigheden:
---
{{#each availableUsers}}
- {{name}} (Rol: {{role}}, Vaardigheden: {{#if skills}}{{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Geen{{/if}})
{{/each}}
---

Jouw taken:
1.  Bepaal welke rollen (bv. Frontend Developer, UI/UX Designer, Project Manager) en hoeveel personen per rol nodig zijn om dit project succesvol uit te voeren.
2.  Baseer je voorstel op de complexiteit, de omvang en de aard van het project zoals beschreven.
3.  Specificeer indien mogelijk welke specifieke vaardigheden belangrijk zijn voor de voorgestelde rollen in de context van dit project.
4.  Bereken de totale personeelsbehoefte ('totalHeadcount').
5.  Geef een duidelijke, beknopte redenering ('reasoning') voor je voorgestelde teamsamenstelling. Leg uit waarom je denkt dat deze specifieke rollen en aantallen nodig zijn.
`,
});

const suggestHeadcountFlow = ai.defineFlow(
  {
    name: 'suggestHeadcountFlow',
    inputSchema: SuggestHeadcountInputSchema,
    outputSchema: SuggestHeadcountOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
