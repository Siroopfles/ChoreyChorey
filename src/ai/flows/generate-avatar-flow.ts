'use server';
/**
 * @fileOverview An AI agent for generating user avatars.
 * - generateAvatar - a function that creates a unique avatar for a user.
 */
import { ai } from '@/ai/genkit';
import { GenerateAvatarInputSchema, GenerateAvatarOutputSchema } from '@/ai/schemas';
import type { GenerateAvatarInput, GenerateAvatarOutput } from '@/ai/schemas';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { compressImage } from '@/lib/utils';

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ userId, name }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a unique, abstract, geometric, vibrant, flat-style avatar for a user named '${name}'. The avatar should be simple, clean, and suitable for a profile picture. Avoid using any text or recognizable faces. The style should be modern and professional. Use a colorful but harmonious palette.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const rawImageDataUri = media.url;
    if (!rawImageDataUri) {
      throw new Error('Image generation failed to return a data URI.');
    }
    
    // Compress the image before uploading
    const compressedImageDataUri = await compressImage(rawImageDataUri, { maxWidth: 256, quality: 0.8 });

    const storageRef = ref(storage, `avatars/${userId}-${Date.now()}.jpg`);
    const uploadResult = await uploadString(storageRef, compressedImageDataUri, 'data_url');
    const avatarUrl = await getDownloadURL(uploadResult.ref);

    return { avatarUrl };
  }
);
