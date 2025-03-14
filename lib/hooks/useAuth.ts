
import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { amplifyClient as client, ModelType } from '@/lib/utils/amplify-client-utils';

type User = ModelType<'User'>;

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAuth(initialUser: User | null = null): AuthState {
  const [user, setUser] = useState<User | null>(initialUser);
  // If we have initial user data, start with loading=false
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    // If we're already loading, don't trigger another load
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const cognitoUser = await getCurrentUser();
      
      const { data: users } = await client.models.User.list({
        filter: {
          cognitoSub: { eq: cognitoUser.userId }
        }
      });

      if (users && users.length > 0) {
        setUser(users[0]);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch user on mount if we don't have initialUser
  useEffect(() => {
    if (!initialUser) {
      fetchUser();
    }
  }, [initialUser]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser
  };
}