
'use server';
/**
 * @fileOverview An AI agent for converting text to speech.
 * - textToSpeech - A function that converts a string of text into audible speech.
 */
import { ai, googleAI } from '@/ai/genkit';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema } from '@/ai/schemas';
import type { TextToSpeechInput, TextToSpeechOutput } from '@/ai/schemas';
import { toWav } from '@/lib/audio-utils';

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (text) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return { audioDataUri };
  }
);
