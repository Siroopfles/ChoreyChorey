
'use server';

import wav from 'wav';

/**
 * Converts a PCM audio buffer to a Base64 encoded WAV string.
 * @param pcmData The raw PCM audio data as a Buffer.
 * @param channels The number of audio channels.
 * @param rate The sample rate.
 * @param sampleWidth The sample width in bytes.
 * @returns A promise that resolves to a Base64 encoded WAV string.
 */
export async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
