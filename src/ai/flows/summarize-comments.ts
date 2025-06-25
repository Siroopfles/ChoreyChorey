'use server';
/**
 * @fileOverview AI agent that summarizes task comments.
 */
import { ai } from '@/ai/genkit';
import { SummarizeCommentsInputSchema, SummarizeCommentsOutputSchema } from '@/ai/schemas';
import type { SummarizeCommentsInput, SummarizeCommentsOutput } from '@/ai/schemas';

export async function summarizeComments(input: SummarizeCommentsInput): Promise<SummarizeCommentsOutput> {
  return summarizeCommentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCommentsPrompt',
  input: { schema: SummarizeCommentsInputSchema },
  output: { schema: SummarizeCommentsOutputSchema },
  prompt: `Je bent een efficiënte assistent. Analyseer de volgende reeks van comments uit een taak en vat de discussie, de belangrijkste punten en de uiteindelijke beslissingen beknopt samen.

Comments:
{{#each comments}}
- {{{this}}}
{{/each}}

Geef alleen de samenvatting.
`,
});

const summarizeCommentsFlow = ai.defineFlow(
  {
    name: 'summarizeCommentsFlow',
    inputSchema: SummarizeCommentsInputSchema,
    outputSchema: SummarizeCommentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
