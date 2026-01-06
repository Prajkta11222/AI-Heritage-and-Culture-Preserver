'use server';

import {
  generateCulturalMemoryStory,
} from '@/ai/flows/generate-cultural-memory-story';
import {
  convertStoryToSpeech,
} from '@/ai/flows/convert-story-to-speech';
import { auth, db, storage } from '@/lib/firebase';
import type { FormState } from '@/lib/types';
import { signInAnonymously } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export async function processHeritageImage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const imageFile = formData.get('image') as File;
  const imageDataUri = formData.get('imageDataUri') as string;

  if (!imageFile || imageFile.size === 0 || !imageDataUri) {
    return {
      status: 'error',
      message: 'Please select an image to upload.',
      data: null,
    };
  }

  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication failed.');
    }

    // 1. Upload original image to Firebase Storage
    const imageId = uuidv4();
    const imagePath = `images/${user.uid}/${imageId}-${imageFile.name}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, imageFile);
    const originalImageUrl = await getDownloadURL(imageRef);

    // 2. Generate story from image
    const { storyText } = await generateCulturalMemoryStory({
      photoDataUri: imageDataUri,
    });

    // 3. Convert story to speech
    const { audioDataUri } = await convertStoryToSpeech(storyText);

    // 4. Upload audio to Firebase Storage
    const audioBuffer = Buffer.from(
      audioDataUri.replace('data:audio/wav;base64,', ''),
      'base64'
    );
    const audioPath = `audio/${user.uid}/${imageId}.wav`;
    const audioRef = ref(storage, audioPath);
    await uploadBytes(audioRef, audioBuffer, { contentType: 'audio/wav' });
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
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      status: 'error',
      message: `Failed to process image: ${errorMessage}`,
      data: null,
    };
  }
}
