import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { InitializationService } from '@/lib/services/initialization-service';

export function useAppInitialization() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      if (!user?.id || initialized || initializing) return;
      
      try {
        setInitializing(true);
        setError(null);
        
        await InitializationService.initializeAppData(user.id);
        
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize app data');
      } finally {
        setInitializing(false);
      }
    }

    if (user?.id) {
      initializeApp();
    }
  }, [user?.id, initialized, initializing]);

  return {
    initialized,
    initializing,
    error
  };
}