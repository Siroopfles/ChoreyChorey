'use server';
/**
 * @fileOverview An AI agent for generating images related to a task.
 * - generateTaskImage - A function that creates an image based on a task's title and description.
 */

import { ai } from '@/ai/genkit';
import { GenerateTaskImageInputSchema, GenerateTaskImageOutputSchema } from '@/ai/schemas';
import type { GenerateTaskImageInput, GenerateTaskImageOutput } from '@/ai/schemas';

export async function generateTaskImage(input: GenerateTaskImageInput): Promise<GenerateTaskImageOutput> {
  return generateTaskImageFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateTaskImagePrompt',
    input: { schema: GenerateTaskImageInputSchema },
    model: 'googleai/gemini-2.0-flash-preview-image-generation',
    config: {
        responseModalities: ['TEXT', 'IMAGE'],
    },
    prompt: `You are a creative visual artist. Generate a single, compelling, photorealistic image that visually represents the following task. The image should be clean, professional, and directly related to the task's content. Do not include any text in the image.

Task Title: {{{title}}}
{{#if description}}
Task Description: {{{description}}}
{{/if}}
`,
});

const generateTaskImageFlow = ai.defineFlow(
  {
    name: 'generateTaskImageFlow',
    inputSchema: GenerateTaskImageInputSchema,
    outputSchema: GenerateTaskImageOutputSchema,
  },
  async (input) => {
    const { media } = await prompt(input);

    const imageDataUri = media.url;
    if (!imageDataUri) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return { imageDataUri };
  }
);
