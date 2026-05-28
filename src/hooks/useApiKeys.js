import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './useAuth';

// Per-user API key storage in Firestore under users/{uid}/config/apiKeys.
// Keys never leave the user's own tenant (see firestore.rules).
//
// The legacy /api/ai/validate-key endpoint was removed (no auth, no rate
// limiting). Until a replacement is added, validation is shape-only on the
// client. The Anthropic proxy still verifies the key format server-side.
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

  // Shape-only validation. The server-side proxy enforces the same regex
  // and will reject malformed keys at call time.
  const validateKey = useCallback(async (provider, value) => {
    if (!value || typeof value !== 'string') return false;
    if (provider === 'anthropic') return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(value.trim());
    if (provider === 'openai')    return /^sk-[A-Za-z0-9_-]{20,}$/.test(value.trim());
    return false;
  }, []);

  const hasKey = useCallback(
    (provider) => Boolean(keys[provider]?.length > 10),
    [keys]
  );

  return { keys, loading, saveKey, validateKey, hasKey };
}
