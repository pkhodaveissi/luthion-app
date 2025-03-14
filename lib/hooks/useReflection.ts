import { useState, useEffect, useCallback } from 'react';
import { ReflectedGoal, ReflectionService } from '@/lib/services/reflection-service';
import { type Schema } from '@/amplify/data/resource';
import { useScore } from './useScore';
import { useRank } from './useRank';

export type ReflectionOption = Schema['ReflectionOption']['type'];
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

  // Format the data
  const formatReflections = (reflections?: ReflectedGoal[]) => {
    if (!reflections) {
      return []
    } 
    return reflections.map(item => ({
      goalId: item.id || '',
      goalText: item.text,
      reflectionId: item.reflection.id || '',
      reflectionOptionId: item.reflection.reflectionOptionId || '',
      reflectionText: item.reflection.reflectionOption.text,
      reflectionType: item.reflection.reflectionOption.reflectionType || '',
      reflectionScore: item.reflection.score,
      reflectedAt: item.reflectedAt as string
    }))
  };

export function useReflection(userId: string, initialReflections?: ReflectedGoal[], initialReflectionOptions?: ReflectionOption[] | null) {
  const { refreshScores } = useScore();
  const { refreshRankData } = useRank(userId);
  
  const [reflectionOptions, setReflectionOptions] = useState<ReflectionOption[]>(initialReflectionOptions || []);
  const formattedReflections = formatReflections(initialReflections)
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>(formattedReflections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reflection options
  const loadReflectionOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const recentData = await ReflectionService.getRecentReflections(userId, limit);
      console.log('fuck: last7 reflections - hook', recentData)
      
    
      const formattedReflections = formatReflections(recentData)
      setRecentReflections(formattedReflections as RecentReflection[]);
    } catch (err) {
      setError('Failed to load recent reflections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Reflect on a goal
  const reflectOnGoal = useCallback(async (goalId: string, reflectionOptionId: string) => {
    if (!userId) {
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
        userId
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
  }, [userId, refreshScores, refreshRankData, loadRecentReflections]);

  // Update an existing reflection
  const updateReflection = useCallback(async (reflectionId: string, newReflectionOptionId: string) => {
    if (!userId) {
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
        userId
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
  }, [userId, refreshScores, refreshRankData, loadRecentReflections]);

  // Get reflection option by ID
  const getReflectionOptionById = useCallback((id: string) => {
    return reflectionOptions.find(option => option.id === id) || null;
  }, [reflectionOptions]);

  // Load options on mount and when user changes
  useEffect(() => {
    if(!initialReflectionOptions) {
      loadReflectionOptions();
    }
    if (userId && !initialReflections) {
      loadRecentReflections();
    }
  }, [userId, loadReflectionOptions, loadRecentReflections, initialReflections, initialReflectionOptions]);

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