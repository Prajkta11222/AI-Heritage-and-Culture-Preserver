'use server';

import type { FormState } from '@/lib/types';
import OpenAI from 'openai';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processHeritageImage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const imageUrl = formData.get('imageUrl') as string;
  const userId = formData.get('userId') as string;
  const imageId = formData.get('imageId') as string;

  if (!imageUrl || !userId || !imageId) {
    return {
      status: 'error',
      message: 'Missing required data to process the image.',
      data: null,
    };
  }

  try {
    // 1. Generate story from image using OpenAI Vision
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze the image and generate a short, neutral cultural or memory-based story (6–7 lines). Avoid guessing dates or facts. Use a respectful, educational tone.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const storyText = visionResponse.choices[0].message?.content;
    if (!storyText) {
      throw new Error('OpenAI did not return a story.');
    }

    // 2. Convert story to speech using OpenAI TTS
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: storyText,
    });
    
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioDataUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    // 3. Store metadata in Firestore
    const heritageData = {
      userId,
      originalImageUrl: imageUrl,
      storyText,
      audioUrl: audioDataUrl, // We will send the data URL to the client
      createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, 'heritage'), heritageData);

    return {
      status: 'success',
      message: 'Heritage story generated successfully.',
      data: { ...heritageData, id: docRef.id },
    };
  } catch (error) {
    console.error('Error processing heritage image:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      status: 'error',
      message: `Failed to process image: ${errorMessage}`,
      data: null,
    };
  }
}
