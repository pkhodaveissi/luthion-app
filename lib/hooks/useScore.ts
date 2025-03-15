import { useState, useEffect, useCallback } from 'react';
import { ScoreService } from '@/lib/services/score-service';

export function useScore(userId: string) {
  const [dailyScore, setDailyScore] = useState(0);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [dailyReflectionCount, setDailyReflectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load score data
  const loadScores = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load daily score
      const dailyScoreData = await ScoreService.getDailyScore(userId);
      if (dailyScoreData) {
        setDailyScore(dailyScoreData.score);
        setDailyReflectionCount(dailyScoreData.reflectionCount);
      } else {
        setDailyScore(0);
        setDailyReflectionCount(0);
      }
      
      // Load weekly score
      const weeklyScoreData = await ScoreService.getCurrentWeekScore(userId);
      if (weeklyScoreData) {
        // check: why this wasn't updated
        setWeeklyScore(weeklyScoreData.score);
      } else {
        setWeeklyScore(0);
      }

    } catch (err) {
      setError('Failed to load scores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Add points to the daily score
  const addPoints = useCallback(async (points: number) => {
    if (!userId) {
      setError('User not authenticated');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Add points to daily score
      await ScoreService.addDailyScore(userId, points);
      
      // Reload scores
      await loadScores();
      
      return true;
    } catch (err) {
      setError('Failed to add points');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, loadScores]);

  // Get daily progress percentage
  const getDailyProgressPercentage = useCallback(() => {
    return Math.min(100, (dailyScore / 40) * 100);
  }, [dailyScore]);

  // Get weekly progress percentage
  const getWeeklyProgressPercentage = useCallback(() => {
    return Math.min(100, (weeklyScore / 280) * 100);
  }, [weeklyScore]);

  // Calculate how many more activities needed to max out daily score
  const getActivitiesNeededForMax = useCallback(() => {
    const pointsPerActivity = 5; // As per requirements
    const pointsNeeded = 40 - dailyScore;
    
    return Math.max(0, Math.ceil(pointsNeeded / pointsPerActivity));
  }, [dailyScore]);

  // Load scores on mount and when user changes
  useEffect(() => {
    if (userId) {
      loadScores();
    }
  }, [userId, loadScores]);
  return {
    dailyScore,
    weeklyScore,
    dailyReflectionCount,
    loading,
    error,
    addPoints,
    refreshScores: loadScores,
    getDailyProgressPercentage,
    getWeeklyProgressPercentage,
    getActivitiesNeededForMax,
    isMaxedOut: dailyScore >= 40
  };
}