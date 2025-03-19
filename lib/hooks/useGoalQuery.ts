// /lib/hooks/useGoalQuery.ts
"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoalService } from '@/lib/services/goal-service';
import { type Schema } from '@/amplify/data/resource';

type Goal = Schema['Goal']['type'];

// Query keys
export const goalKeys = {
  all: ['goals'] as const,
  current: (userId: string) => [...goalKeys.all, 'current', userId] as const,
  detail: (goalId: string) => [...goalKeys.all, 'detail', goalId] as const,
};

export function useCurrentGoal(userId: string, initialData?: Goal | null) {
  return useQuery({
    queryKey: goalKeys.current(userId),
    queryFn: () => GoalService.getCurrentGoal(userId),
    enabled: !!userId,
    initialData: initialData || undefined,
  });
}
export function useGoalMutations(userId: string) {
  const queryClient = useQueryClient();

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (text: string) => {
      console.log('useGoalQuery: Creating goal:', text);
      return GoalService.createGoal({ text, userId })
    },
    onSuccess: (newGoal) => {
      // Update the cache immediately
      queryClient.setQueryData(
        goalKeys.current(userId),
        newGoal
      );
      // Invalidate to ensure fresh data after navigation
    },
  });

  // Update goal text mutation
  const updateGoalTextMutation = useMutation({
    mutationFn: ({ id, text }: { id: string, text: string }) => {
      // Add logging to debug
      console.log('useGoalQuery: Updating goal text:', id, text);
      return GoalService.updateGoalText({ id, text });
    },
    onSuccess: (updatedGoal) => {
      console.log('useGoalQuery: Goal text updated successfully:', updatedGoal);
      queryClient.setQueryData(
        goalKeys.current(userId),
        updatedGoal
      );
      if (updatedGoal.id) {
        queryClient.setQueryData(
          goalKeys.detail(updatedGoal.id),
          updatedGoal
        );
      }
      // Invalidate to ensure fresh data
    },
    onError: (error) => {
      console.error('Error updating goal text:', error);
    }
  });

  const resetEditingMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Resetting goal', id);
      return GoalService.resetGoalEditing(id);
    },
    onSuccess: (updatedGoal) => {
      console.log('useGoalQuery: Goal editing reset successfully:', updatedGoal);
      queryClient.setQueryData(
        goalKeys.current(userId),
        updatedGoal
      );
      if (updatedGoal.id) {
        queryClient.setQueryData(
          goalKeys.detail(updatedGoal.id),
          updatedGoal
        );
      }
      // Invalidate to ensure fresh data
    },
    onError: (error) => {
      console.error('Error resetting goal editing:', error);
    }
  });

  // Commit goal mutation
  const commitGoalMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('useGoalQuery: Committing goal:', id);
      return GoalService.commitGoal(id);
    },
    onSuccess: (committedGoal) => {
      console.log('useGoalQuery: Goal committed successfully:', committedGoal);
      queryClient.setQueryData(
        goalKeys.current(userId),
        committedGoal
      );
      if (committedGoal.id) {
        queryClient.setQueryData(
          goalKeys.detail(committedGoal.id),
          committedGoal
        );
      }
      // Invalidate to ensure fresh data
    },
    onError: (error) => {
      console.error('Error committing goal:', error);
    }
  });

  // Reflect on goal mutation
  const reflectOnGoalMutation = useMutation({
    mutationFn: ({ goalId, reflectionOptionId }: { goalId: string, reflectionOptionId: string }) => {
      console.log('useGoalQuery:  Reflecting on goal:', goalId, 'with option:', reflectionOptionId);
      return GoalService.reflectOnGoal(goalId, reflectionOptionId);
    },
    onSuccess: (reflectedGoal) => {
      console.log('useGoalQuery: Goal reflection successful:', reflectedGoal);
      // Update queries and invalidate related data
      queryClient.setQueryData(
        goalKeys.current(userId),
        null // Clear current goal after reflection
      );
      if (reflectedGoal.id) {
        queryClient.setQueryData(
          goalKeys.detail(reflectedGoal.id),
          reflectedGoal
        );
      }
      // Invalidate score data and current goal
    },
    onError: (error) => {
      console.error('Error reflecting on goal:', error);
    }
  });

  return {
    // Change to use mutation with callbacks for better control
    createGoal: (text: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
      return createGoalMutation.mutateAsync(text, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as Error);
        }
      });
    },
    updateGoalText: ({ id, text }: { id: string, text: string },
      options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
      if (!id) {
        console.error('No goal ID provided for update');
        options?.onError?.(new Error('No goal ID provided for update'));
        return Promise.reject(new Error('No goal ID provided for update'));
      }

      return updateGoalTextMutation.mutateAsync({ id, text }, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as Error);
        }
      });
    },
    resetEditing: (id: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
      if (!id) {
        console.error('No goal ID provided for reset editing');
        options?.onError?.(new Error('No goal ID provided for reset editing'));
        return Promise.reject(new Error('No goal ID provided for reset editing'));
      }

      return resetEditingMutation.mutateAsync(id, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as Error);
        }
      });
    },
    commitGoal: (id: string, options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
      if (!id) {
        console.error('No goal ID provided for commit');
        options?.onError?.(new Error('No goal ID provided for commit'));
        return Promise.reject(new Error('No goal ID provided for commit'));
      }

      return commitGoalMutation.mutateAsync(id, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as Error);
        }
      });
    },
    reflectOnGoal: ({ goalId, reflectionOptionId }: { goalId: string, reflectionOptionId: string },
      options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
      if (!goalId) {
        console.error('No goal ID provided for reflection');
        options?.onError?.(new Error('No goal ID provided for reflection'));
        return Promise.reject(new Error('No goal ID provided for reflection'));
      }

      return reflectOnGoalMutation.mutateAsync({ goalId, reflectionOptionId }, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as Error);
        }
      });
    },

    // States
    isLoading:
      createGoalMutation.isPending ||
      updateGoalTextMutation.isPending ||
      resetEditingMutation.isPending ||
      commitGoalMutation.isPending ||
      reflectOnGoalMutation.isPending,
    error:
      createGoalMutation.error ||
      updateGoalTextMutation.error ||
      resetEditingMutation.error ||
      commitGoalMutation.error ||
      reflectOnGoalMutation.error,
  };
}
