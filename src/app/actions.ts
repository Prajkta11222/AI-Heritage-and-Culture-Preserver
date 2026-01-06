'use server';

import type { FormState } from '@/lib/types';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize Firebase Admin SDK for server-side operations
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processHeritageImage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const imageFile = formData.get('image') as File;

  if (!imageFile || imageFile.size === 0) {
    return {
      status: 'error',
      message: 'Please select an image to upload.',
      data: null,
    };
  }

  try {
    // Ensure user is signed in anonymously
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication failed. Could not get user.');
    }

    // 1. Upload original image to Firebase Storage
    const imageId = uuidv4();
    const imagePath = `images/${user.uid}/${imageId}-${imageFile.name}`;
    const imageRef = ref(storage, imagePath);
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    await uploadBytes(imageRef, imageBuffer, { contentType: imageFile.type });
    const originalImageUrl = await getDownloadURL(imageRef);

    // 2. Generate story from image using OpenAI Vision
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
                url: originalImageUrl,
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

    // 3. Convert story to speech using OpenAI TTS
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: storyText,
    });

    // 4. Upload audio to Firebase Storage
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioPath = `audio/${user.uid}/${imageId}.mp3`;
    const audioRef = ref(storage, audioPath);
    await uploadBytes(audioRef, audioBuffer, { contentType: 'audio/mpeg' });
    const audioUrl = await getDownloadURL(audioRef);

    // 5. Store metadata in Firestore
    const heritageData = {
      userId: user.uid,
      originalImageUrl,
      storyText,
      audioUrl,
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
