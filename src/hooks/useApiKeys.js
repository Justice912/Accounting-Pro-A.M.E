import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './useAuth';

export function useApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState({ anthropic: '', openai: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'config', 'apiKeys');
    getDoc(ref).then((snap) => {
      if (snap.exists()) setKeys(snap.data());
      setLoading(false);
    });
  }, [user]);

  const saveKey = useCallback(
    async (provider, value) => {
      if (!user) throw new Error('Not authenticated');
      const ref = doc(db, 'users', user.uid, 'config', 'apiKeys');
      const updated = { ...keys, [provider]: value };
      await setDoc(ref, updated, { merge: true });
      setKeys(updated);
    },
    [user, keys]
  );

  const validateKey = useCallback(async (provider, value) => {
    const r = await fetch('/api/ai/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey: value }),
    });
    const data = await r.json();
    return data.valid === true;
  }, []);

  const hasKey = useCallback(
    (provider) => Boolean(keys[provider]?.length > 10),
    [keys]
  );

  return { keys, loading, saveKey, validateKey, hasKey };
}
