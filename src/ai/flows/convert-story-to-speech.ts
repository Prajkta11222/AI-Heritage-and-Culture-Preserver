'use server';
/**
 * @fileOverview Converts the generated story text into voice narration using OpenAI Text-to-Speech.
 *
 * - convertStoryToSpeech - A function that handles the conversion of story text to speech.
 * - ConvertStoryToSpeechInput - The input type for the convertStoryToSpeech function.
 * - ConvertStoryToSpeechOutput - The return type for the convertStoryToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const ConvertStoryToSpeechInputSchema = z.string().describe('The story text to convert to speech.');
export type ConvertStoryToSpeechInput = z.infer<typeof ConvertStoryToSpeechInputSchema>;

const ConvertStoryToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio narration of the story as a data URI.'),
});
export type ConvertStoryToSpeechOutput = z.infer<typeof ConvertStoryToSpeechOutputSchema>;

export async function convertStoryToSpeech(input: ConvertStoryToSpeechInput): Promise<ConvertStoryToSpeechOutput> {
  return convertStoryToSpeechFlow(input);
}

const convertStoryToSpeechFlow = ai.defineFlow(
  {
    name: 'convertStoryToSpeechFlow',
    inputSchema: ConvertStoryToSpeechInputSchema,
    outputSchema: ConvertStoryToSpeechOutputSchema,
  },
  async (storyText) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: storyText,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      audioDataUri: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
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

    let bufs = [] as any[];
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
