import { useState, useEffect, useCallback } from 'react';
import { GoalService } from '@/lib/services/goal-service';
import { type Schema } from '@/amplify/data/resource';
import { useAuth } from '@/lib/hooks/useAuth';

type Goal = Schema['Goal']['type'];

export function useGoal() {
  const { user } = useAuth(); // Get current user
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Load the current goal
  const loadGoal = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const currentGoal = await GoalService.getCurrentGoal(user.id);
      setGoal(currentGoal);
      
      // If there's a goal with committedAt but not locked yet, start the timer
      if (currentGoal?.committedAt && currentGoal.status === 'draft' && !currentGoal.lockedAt) {
        const committedTime = new Date(currentGoal.committedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsedMs = currentTime - committedTime;
        const remainingSec = Math.max(0, 300 - Math.floor(elapsedMs / 1000)); // 300 seconds = 5 minutes
        
        setTimeRemaining(remainingSec);
      }
    } catch (err) {
      setError('Failed to load goal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new goal
  const createGoal = useCallback(async (text: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      const newGoal = await GoalService.createGoal({ 
        text, 
        userId: user.id, 
      });
      setGoal(newGoal);
      return newGoal;
    } catch (err) {
      setError('Failed to create goal');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update goal text
  const updateGoalText = useCallback(async (text: string) => {
    if (!goal?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      const updatedGoal = await GoalService.updateGoalText({ 
        id: goal.id, 
        text 
      });
      setGoal(updatedGoal);
      return updatedGoal;
    } catch (err) {
      setError('Failed to update goal');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [goal?.id]);

  const resetEditing = useCallback(async (goalId?: string) => {
    const id = goalId || goal?.id;
    if (!id) return null;
    
    try {
      setLoading(true);
      setError(null);
      const updatedGoal = await GoalService.resetGoalEditing(id);
      console.log('fuck inside reset hook', updatedGoal)

      setGoal(updatedGoal);
      return updatedGoal;
    } catch (err) {
      setError('Failed to reset goal editing');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [goal?.id]);

  // Commit a goal (lock it after editing)
  const commitGoal = useCallback(async (goalId?: string) => {
    const id = goalId || goal?.id;
    if (!id) return null;
    
    try {
      setLoading(true);
      setError(null);
      const committedGoal = await GoalService.commitGoal(id);
      setGoal(committedGoal);
      return committedGoal;
    } catch (err) {
      setError('Failed to commit goal');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [goal?.id]);

  // Reflect on a goal
  const reflectOnGoal = useCallback(async (reflectionOptionId: string, goalId?: string) => {
    const id = goalId || goal?.id;
    if (!id) return null;
    
    try {
      setLoading(true);
      setError(null);
      const reflectedGoal = await GoalService.reflectOnGoal(id, reflectionOptionId);
      setGoal(reflectedGoal);
      return reflectedGoal;
    } catch (err) {
      setError('Failed to reflect on goal');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [goal?.id]);

  // Delete a goal (only allowed for drafts)
  const deleteGoal = useCallback(async (goalId?: string) => {
    const id = goalId || goal?.id;
    if (!id) return false;
    
    try {
      setLoading(true);
      setError(null);
      await GoalService.deleteGoal(id);
      setGoal(null);
      return true;
    } catch (err) {
      setError('Failed to delete goal');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [goal?.id]);

  // Update the timer every second when goal is in editing mode
  useEffect(() => {
    if (!goal?.committedAt || goal.status !== 'draft' || goal.lockedAt) return;
    
    const timerInterval = setInterval(() => {
      const committedTime = new Date(goal.committedAt!).getTime();
      const currentTime = new Date().getTime();
      const elapsedMs = currentTime - committedTime;
      const remainingSec = Math.max(0, 300 - Math.floor(elapsedMs / 1000)); // 300 seconds = 5 minutes
      
      setTimeRemaining(remainingSec);
      
      // Auto-lock goal if timer expires
      if (remainingSec <= 0) {
        commitGoal();
        clearInterval(timerInterval);
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [goal, commitGoal]);

  // Load the goal on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadGoal();
    }
  }, [user?.id, loadGoal]);

  return {
    goal,
    loading,
    error,
    timeRemaining,
    createGoal,
    updateGoalText,
    resetEditing,
    commitGoal,
    reflectOnGoal,
    deleteGoal,
    refreshGoal: loadGoal,
    hasActiveGoal: !!goal && (goal.status === 'draft' || goal.status === 'committed'),
    isEditing: !!goal?.committedAt && goal.status === 'draft' && !goal.lockedAt,
    isCommitted: goal?.status === 'committed',
  };
}