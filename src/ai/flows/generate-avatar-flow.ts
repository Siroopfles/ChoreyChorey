'use server';
/**
 * @fileOverview An AI agent for generating user avatars.
 * - generateAvatar - A function that creates a unique avatar for a user.
 */
import { ai } from '@/ai/genkit';
import { GenerateAvatarInputSchema, GenerateAvatarOutputSchema } from '@/ai/schemas';
import type { GenerateAvatarInput, GenerateAvatarOutput } from '@/ai/schemas';

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (name) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `Generate a unique, abstract, geometric, vibrant, flat-style avatar for a user named '${name}'. The avatar should be simple, clean, and suitable for a profile picture. Avoid using any text or recognizable faces. The style should be modern and professional. Use a colorful but harmonious palette.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const avatarDataUri = media.url;
    if (!avatarDataUri) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return { avatarDataUri };
  }
);
