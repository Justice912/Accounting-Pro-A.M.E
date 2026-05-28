import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// getAuth validates the API key immediately — guard against missing env vars
// so a misconfigured deployment doesn't crash the whole app
let auth = null;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase Auth unavailable (check VITE_FIREBASE_API_KEY):', e.message);
}
export { auth };

// Resolves once we have a signed-in (possibly anonymous) Firebase user.
// Every authenticated read/write in webApi.js depends on this completing,
// so we bootstrap anon sign-in eagerly on module load — that way callers
// like VATCapture (which do not mount useAuth) still get a uid.
export const authReady = new Promise((resolve) => {
  if (!auth) {
    resolve(null);
    return;
  }
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (user) {
      unsub();
      resolve(user);
      return;
    }
    try {
      const cred = await signInAnonymously(auth);
      unsub();
      resolve(cred.user);
    } catch (e) {
      console.warn('Anonymous sign-in failed:', e?.message || e);
      unsub();
      resolve(null);
    }
  });
});
