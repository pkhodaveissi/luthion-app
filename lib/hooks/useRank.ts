import { useState, useEffect, useCallback } from 'react';
import { RankService } from '@/lib/services/rank-service';
import { useAuth } from '@/lib/hooks/useAuth';

type WeeklyProgressItem = {
  week: string;
  score: number;
  isCurrentWeek: boolean;
};
interface RankData {
  rank: string;
  points: number;
  previousRank: number;
  nextRank: number;
  nextRankName: string | null;
  previousRankName: string | null;
  weeklyProgress: Array<WeeklyProgressItem>;
  currentWeekScore: number;
  todayScore: number;
  todayReflectionCount: number;
}

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

export function useRank() {
  const { user } = useAuth();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rank data
  const loadRankData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      
      // Update completed weeks
      await RankService.updateCompletedWeeks(user.id);
      
      // Calculate and update rank
      await RankService.calculateAndUpdateRank(user.id);
      
      // Get formatted rank page data
      const data = await RankService.getRankPageData(user.id);
      data['weeklyProgress'] = fillWeeklyProgress(data.weeklyProgress).reverse()
      setRankData(data);
    } catch (err) {
      setError('Failed to load rank data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
    if (user?.id) {
      loadRankData();
    }
  }, [user?.id, loadRankData]);

  return {
    rankData,
    loading,
    error,
    refreshRankData: loadRankData,
    getProgressInTierPercentage
  };
}