'use server';
/**
 * @fileOverview An AI agent for generating images related to a task.
 * - generateTaskImage - A function that creates an image based on a task's title and description.
 */

import { ai } from '@/ai/genkit';
import { GenerateTaskImageInputSchema, GenerateTaskImageOutputSchema } from '@/ai/schemas';
import type { GenerateTaskImageInput, GenerateTaskImageOutput } from '@/ai/schemas';
import { getDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import type { Organization } from '@/lib/types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { compressImage } from '@/lib/utils';

export async function generateTaskImage(input: Omit<GenerateTaskImageInput, 'primaryColor'> & { organizationId: string }): Promise<GenerateTaskImageOutput> {
  const orgDoc = await getDoc(doc(db, 'organizations', input.organizationId));
  const primaryColor = orgDoc.exists() ? (orgDoc.data() as Organization).settings?.branding?.primaryColor : undefined;

  return generateTaskImageFlow({ ...input, primaryColor });
}

const generateTaskImageFlow = ai.defineFlow(
  {
    name: 'generateTaskImageFlow',
    inputSchema: GenerateTaskImageInputSchema,
    outputSchema: GenerateTaskImageOutputSchema,
  },
  async ({ title, description, primaryColor }) => {
    const colorInstruction = primaryColor
      ? `The image should subtly incorporate the primary brand color hsl(${primaryColor}) as an accent or in the overall color palette to maintain a consistent visual style.`
      : '';

    const promptText = `You are a creative visual artist. Generate a single, compelling, photorealistic image that visually represents the following task. The image should be clean, professional, and directly related to the task's content. Do not include any text in the image. ${colorInstruction}

Task Title: ${title}
${description ? `Task Description: ${description}` : ''}
`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptText,
      config: {
          responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const rawImageDataUri = media.url;
    if (!rawImageDataUri) {
      throw new Error('Image generation failed to return a data URI.');
    }

    // Compress the image before uploading
    const compressedImageDataUri = await compressImage(rawImageDataUri, { maxWidth: 1024, quality: 0.85 });

    const imageId = crypto.randomUUID();
    const storageRef = ref(storage, `task-images/${imageId}.jpg`);
    const uploadResult = await uploadString(storageRef, compressedImageDataUri, 'data_url');
    const imageUrl = await getDownloadURL(uploadResult.ref);

    return { imageUrl };
  }
);
