'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'studio-6600806137-b43a8',
  appId: '1:729472765948:web:76fa040c5de6704e2f6c79',
  apiKey: 'AIzaSyB40swyz6Q-SKJy80JWczjYDVegFXnMwSM',
  authDomain: 'studio-6600806137-b43a8.firebaseapp.com',
  messagingSenderId: '729472765948',
  storageBucket: 'studio-6600806137-b43a8.appspot.com',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Error initializing Firebase services:", error);
  // Handle the error appropriately, maybe by showing a message to the user
}


let authInitialized = false;

const initializeAuth = () => {
  if (authInitialized || !auth) return;
  authInitialized = true;
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Anonymous sign-in failed:', error);
      }
    }
  });
};

export { app, auth, db, storage, initializeAuth };
