'use client';

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

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
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

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refresh: fetchUser
  };
}