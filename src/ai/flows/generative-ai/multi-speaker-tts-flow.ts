
'use server';
/**
 * @fileOverview An AI agent for converting a thread of comments to multi-speaker speech.
 * - multiSpeakerTextToSpeech - A function that converts an array of comments into a single audible conversation.
 */
import { ai } from '@/ai/genkit';
import { MultiSpeakerTextToSpeechInputSchema, MultiSpeakerTextToSpeechOutputSchema } from '@/ai/schemas';
import type { MultiSpeakerTextToSpeechInput, MultiSpeakerTextToSpeechOutput } from '@/ai/schemas';
import { toWav } from '@/lib/utils/audio-utils';
import { z } from 'genkit';

export async function multiSpeakerTextToSpeech(input: MultiSpeakerTextToSpeechInput): Promise<MultiSpeakerTextToSpeechOutput> {
  return multiSpeakerTextToSpeechFlow(input);
}

const PREBUILT_VOICES = ['Algenib', 'Achernar', 'Sirius', 'Canopus', 'Arcturus', 'Rigel', 'Capella'];

const multiSpeakerTextToSpeechFlow = ai.defineFlow(
  {
    name: 'multiSpeakerTextToSpeechFlow',
    inputSchema: MultiSpeakerTextToSpeechInputSchema,
    outputSchema: MultiSpeakerTextToSpeechOutputSchema,
  },
  async ({ comments }) => {
    if (comments.length === 0) {
      throw new Error('No comments provided to synthesize.');
    }

    const uniqueUsers = Array.from(new Set(comments.map(c => c.userId)));
    if (uniqueUsers.length > PREBUILT_VOICES.length) {
      throw new Error(`This conversation has ${uniqueUsers.length} speakers, but only ${PREBUILT_VOICES.length} unique voices are supported.`);
    }

    const userToSpeakerMapping = new Map<string, string>();
    const speakerVoiceConfigs = uniqueUsers.map((userId, index) => {
      const speakerLabel = `Spreker${index + 1}`;
      userToSpeakerMapping.set(userId, speakerLabel);
      return {
        speaker: speakerLabel,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: PREBUILT_VOICES[index] },
        },
      };
    });
    
    const conversationScript = comments.map(comment => {
      const speakerLabel = userToSpeakerMapping.get(comment.userId);
      // Replace names with speaker labels for better TTS performance, e.g., "Speaker1 says..." -> "says..."
      const cleanedText = comment.text.replace(new RegExp(`^${comment.userName}`, 'i'), '');
      return `${speakerLabel}: ${cleanedText}`;
    }).join('\n');


    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: { speakerVoiceConfigs },
        },
      },
      prompt: conversationScript,
    });

    if (!media) {
      throw new Error('No media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return { audioDataUri };
  }
);
