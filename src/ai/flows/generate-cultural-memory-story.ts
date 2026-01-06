'use server';

/**
 * @fileOverview Generates a cultural or memory-based story from an image using OpenAI Vision.
 *
 * - generateCulturalMemoryStory - A function that handles the story generation process.
 * - GenerateCulturalMemoryStoryInput - The input type for the generateCulturalMemoryStory function.
 * - GenerateCulturalMemoryStoryOutput - The return type for the generateCulturalMemoryStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCulturalMemoryStoryInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a heritage site or old family photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateCulturalMemoryStoryInput = z.infer<
  typeof GenerateCulturalMemoryStoryInputSchema
>;

const GenerateCulturalMemoryStoryOutputSchema = z.object({
  storyText: z
    .string()
    .describe(
      'A short, neutral cultural or memory-based story (6–7 lines) generated from the image. Avoid guessing dates or facts. Use a respectful, educational tone.'
    ),
});
export type GenerateCulturalMemoryStoryOutput = z.infer<
  typeof GenerateCulturalMemoryStoryOutputSchema
>;

export async function generateCulturalMemoryStory(
  input: GenerateCulturalMemoryStoryInput
): Promise<GenerateCulturalMemoryStoryOutput> {
  return generateCulturalMemoryStoryFlow(input);
}

const generateCulturalMemoryStoryPrompt = ai.definePrompt({
  name: 'generateCulturalMemoryStoryPrompt',
  input: {schema: GenerateCulturalMemoryStoryInputSchema},
  output: {schema: GenerateCulturalMemoryStoryOutputSchema},
  prompt: `Analyze the image and generate a short, neutral cultural or memory-based story (6–7 lines).
Avoid guessing dates or facts. Use a respectful, educational tone.

Image: {{media url=photoDataUri}}
`,
});

const generateCulturalMemoryStoryFlow = ai.defineFlow(
  {
    name: 'generateCulturalMemoryStoryFlow',
    inputSchema: GenerateCulturalMemoryStoryInputSchema,
    outputSchema: GenerateCulturalMemoryStoryOutputSchema,
  },
  async input => {
    const {output} = await generateCulturalMemoryStoryPrompt(input);
    return output!;
  }
);
