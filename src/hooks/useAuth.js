import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../api/firebase';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    // auth is null when Firebase env vars are missing — degrade gracefully
    if (!auth) {
      setUser(null);
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
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
