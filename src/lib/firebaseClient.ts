'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onIdTokenChanged, type Auth } from 'firebase/auth';

import { clearToken, setToken } from '@/lib/auth';

let cachedAuth: Auth | null = null;
let tokenSyncStarted = false;

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

export function startFirebaseTokenSync() {
  if (typeof window === 'undefined') return;
  if (tokenSyncStarted) return;
  tokenSyncStarted = true;

  const auth = getFirebaseAuth();
  onIdTokenChanged(auth, async (user) => {
    try {
      if (!user) {
        clearToken();
        return;
      }
      const idToken = await user.getIdToken(true);
      setToken(idToken);
    } catch {
      clearToken();
    }
  });
}
