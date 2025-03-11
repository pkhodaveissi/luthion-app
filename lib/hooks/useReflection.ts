import { useState, useEffect, useCallback } from 'react';
import { ReflectionService } from '@/lib/services/reflection-service';
import { type Schema } from '@/amplify/data/resource';
import { useAuth } from '@/lib/hooks/useAuth';
import { useScore } from './useScore';
import { useRank } from './useRank';

type ReflectionOption = Schema['ReflectionOption']['type'];
type RecentReflection = {
  goalId: string;
  goalText: string;
  reflectionId: string;
  reflectionOptionId: string;
  reflectionText: string;
  reflectionType: string;
  reflectionScore: number;
  reflectedAt: string;
};

export function useReflection() {
  const { user } = useAuth();
  const { refreshScores } = useScore();
  const { refreshRankData } = useRank();
  
  const [reflectionOptions, setReflectionOptions] = useState<ReflectionOption[]>([]);
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reflection options
  const loadReflectionOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize options if needed
      await ReflectionService.initializeReflectionOptions();
      
      // Get all active options
      const options = await ReflectionService.getReflectionOptions();
      setReflectionOptions(options);
    } catch (err) {
      setError('Failed to load reflection options');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load recent reflections
  const loadRecentReflections = useCallback(async (limit: number = 7) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const recentData = await ReflectionService.getRecentReflections(user.id, limit);
      
      // Format the data
      const formattedReflections = recentData.map(item => ({
        goalId: item.goal.id || '',
        goalText: item.goal.text,
        reflectionId: item.reflection.id || '',
        reflectionOptionId: item.reflection.reflectionOptionId || '',
        reflectionText: item.reflectionOption.text,
        reflectionType: item.reflectionOption.reflectionType || '',
        reflectionScore: item.reflection.score,
        reflectedAt: item.goal.reflectedAt || new Date().toISOString()
      }));
      
      setRecentReflections(formattedReflections);
    } catch (err) {
      setError('Failed to load recent reflections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Reflect on a goal
  const reflectOnGoal = useCallback(async (goalId: string, reflectionOptionId: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create reflection
      const reflection = await ReflectionService.reflectOnGoal(
        goalId,
        reflectionOptionId,
        user.id
      );
      
      // Refresh scores and rank data
      await refreshScores();
      await refreshRankData();
      
      // Reload recent reflections
      await loadRecentReflections();
      
      return reflection;
    } catch (err) {
      setError('Failed to reflect on goal');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshScores, refreshRankData, loadRecentReflections]);

  // Update an existing reflection
  const updateReflection = useCallback(async (reflectionId: string, newReflectionOptionId: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update reflection
      const updatedReflection = await ReflectionService.updateReflection(
        reflectionId,
        newReflectionOptionId,
        user.id
      );
      
      // Refresh scores and rank data
      await refreshScores();
      await refreshRankData();
      
      // Reload recent reflections
      await loadRecentReflections();
      
      return updatedReflection;
    } catch (err) {
      setError('Failed to update reflection');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshScores, refreshRankData, loadRecentReflections]);

  // Get reflection option by ID
  const getReflectionOptionById = useCallback((id: string) => {
    return reflectionOptions.find(option => option.id === id) || null;
  }, [reflectionOptions]);

  // Load options on mount and when user changes
  useEffect(() => {
    loadReflectionOptions();
    
    if (user?.id) {
      loadRecentReflections();
    }
  }, [user?.id, loadReflectionOptions, loadRecentReflections]);

  return {
    reflectionOptions,
    recentReflections,
    loading,
    error,
    reflectOnGoal,
    updateReflection,
    getReflectionOptionById,
    refreshReflections: loadRecentReflections
  };
}