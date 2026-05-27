import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// When env vars are missing, skip Firebase init entirely. Otherwise Firestore
// retries the backend forever and spams the console; webApi consumers wrap
// every call in try/catch so they'll return [] / { success: false } cleanly.
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let db = null;
let storage = null;
let auth = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    auth = getAuth(app);
  } catch (e) {
    console.warn('Firebase Auth unavailable (check VITE_FIREBASE_API_KEY):', e.message);
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    '[firebase] Skipping initialization — VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID not set. ' +
    'VAT Capture and other Firestore-backed features will be unavailable until env vars are configured in Vercel.'
  );
}

export { db, storage, auth };
