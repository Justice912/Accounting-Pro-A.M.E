import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../api/firebase';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // Sign in anonymously so every browser session has a stable UID
        try {
          const credential = await signInAnonymously(auth);
          setUser(credential.user);
        } catch {
          setUser(null);
        }
      }
    });
  }, []);

  return { user, loading: user === undefined };
}
