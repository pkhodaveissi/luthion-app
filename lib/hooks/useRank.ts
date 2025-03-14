import { useState, useEffect, useCallback } from 'react';
import { RankService } from '@/lib/services/rank-service';
import { RankPageData } from '../services/goal-service-ssr';

type WeeklyProgressItem = {
  week: string;
  score: number;
  isCurrentWeek: boolean;
};


function fillWeeklyProgress(data: Array<WeeklyProgressItem>): Array<WeeklyProgressItem> {
  // Define the 13-week structure
  const fullWeeks: string[] = Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`);

  // Convert existing data into a dictionary for easy lookup
  const existingWeeks: Record<string, number> = data.reduce(
    (acc, item) => ({ ...acc, [item.week]: item.score }),
    {}
  );

  // Create the full weekly progress list, filling in missing weeks with default score 0
  const weeklyProgress: WeeklyProgressItem[] = fullWeeks.map(week => ({
    week,
    score: existingWeeks[week] ?? 0, // If the week exists, use its score; otherwise, default to 0
    isCurrentWeek: week === `Week ${data.length + 1}` // Mark the current week as true
  }));

  return weeklyProgress;
}

export function useRank(userId: string, initialRankData?: RankPageData) {
  const [rankData, setRankData] = useState<RankPageData | null>(initialRankData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rank data
  const loadRankData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      
      // Update completed weeks
      await RankService.updateCompletedWeeks(userId);
      
      // Calculate and update rank
      await RankService.calculateAndUpdateRank(userId);
      
      // Get formatted rank page data
      const data = await RankService.getRankPageData(userId);
      data['weeklyProgress'] = fillWeeklyProgress(data.weeklyProgress).reverse()
      setRankData(data);
    } catch (err) {
      setError('Failed to load rank data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadClientRankData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setError(null);
      // Update completed weeks
      await RankService.updateCompletedWeeks(userId);
      
      // Calculate and update rank
      await RankService.calculateAndUpdateRank(userId);
      
      // Get formatted rank page data
      const data = await RankService.getRankPageData(userId);
      data['weeklyProgress'] = fillWeeklyProgress(data.weeklyProgress).reverse()
      setRankData(data);
    } catch (err) {
      setError('Failed to load rank data');
      console.error(err);
    }
  }, [userId]);
  // Calculate progress percentage within current tier
  const getProgressInTierPercentage = useCallback(() => {
    if (!rankData) return 0;
    
    const { points, previousRank, nextRank } = rankData;
    const range = nextRank - previousRank;
    
    if (range <= 0) return 100;
    
    return Math.min(100, ((points - previousRank) / range) * 100);
  }, [rankData]);

  // Load rank data on mount and when user changes
  useEffect(() => {
    if (userId && !initialRankData) {
      loadRankData();
    }
    if(!rankData?.weeklyProgress?.length) {
      loadClientRankData()
    }
  }, [userId, loadRankData, initialRankData]);

  return {
    rankData,
    loading,
    error,
    refreshRankData: loadRankData,
    getProgressInTierPercentage
  };
}