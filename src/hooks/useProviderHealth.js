import { useState, useEffect, useCallback } from 'react';

export function useProviderHealth() {
  const [health, setHealth] = useState({});
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      if (window.api) {
        const result = await window.api.getProviderHealth();
        setHealth(result || {});
      }
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const getStatus = useCallback((providerId) => {
    return health[providerId] || 'unknown';
  }, [health]);

  const isHealthy = useCallback((providerId) => {
    return health[providerId] === 'healthy';
  }, [health]);

  return { health, checking, checkHealth, getStatus, isHealthy };
}
