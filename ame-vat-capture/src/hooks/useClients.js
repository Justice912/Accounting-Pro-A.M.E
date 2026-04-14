import { useEffect, useState } from 'react';
import { subscribeToClients } from '../services/clientService.js';
import { DEFAULT_FIRM_ID } from '../config/firebase.js';

export function useClients(firmId = DEFAULT_FIRM_ID) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToClients(
      (next) => {
        setClients(next);
        setLoading(false);
      },
      (err) => {
        console.error('[useClients] snapshot error', err);
        setError(err);
        setLoading(false);
      },
      firmId
    );
    return unsubscribe;
  }, [firmId]);

  return { clients, loading, error };
}
