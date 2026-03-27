'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  // Prevent Next.js prerender/build from evaluating Firebase (and throwing) on the server.
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available in the browser');
  }

  if (cachedAuth) return cachedAuth;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY (check Vercel Environment Variables)');
  }

  const firebaseConfig = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
