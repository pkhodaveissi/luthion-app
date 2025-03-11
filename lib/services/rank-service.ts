import { amplifyClient as client } from '@/lib/utils/amplify-client-utils';
import { type Schema } from '@/amplify/data/resource';
import { ScoreService } from './score-service';

type UserRank = Schema['UserRank']['type'];
type RankTier = Schema['RankTier']['type'];

// Define rank tiers according to requirements
const RANK_TIERS = [
  { name: 'Peak', minScore: 3100, maxScore: 3360, description: 'At the highest level of engagement, maintaining peak performance.' },
  { name: 'Momentum', minScore: 2700, maxScore: 3100, description: 'Highly engaged, but could slip if not consistent.' },
  { name: 'Flowing', minScore: 2200, maxScore: 2700, description: 'Strong, steady engagement with minor dips.' },
  { name: 'Steady', minScore: 1600, maxScore: 2200, description: 'Moderately engaged, but not fully consistent.' },
  { name: 'Rebuilding', minScore: 1000, maxScore: 1600, description: 'Gaining momentum after a drop or break.' },
  { name: 'Renewing', minScore: 400, maxScore: 1000, description: 'Low engagement, but showing signs of progress.' },
  { name: 'Starting', minScore: 0, maxScore: 400, description: 'Almost inactive, starting over from a minimal base.' },
];

// Define a type for the rank page data
interface RankPageData {
  rank: string;
  points: number;
  previousRank: number;
  nextRank: number;
  nextRankName: string | null;
  previousRankName: string | null;
  weeklyProgress: Array<{
    week: string;
    score: number;
    isCurrentWeek: boolean;
  }>;
  currentWeekScore: number;
  todayScore: number;
  todayReflectionCount: number;
}

export class RankService {
  
  // Calculate and update user's rank based on their last 12 complete weeks
  static async calculateAndUpdateRank(userId: string): Promise<UserRank> {
    try {
      // Get weekly scores for the last 13 weeks
      const weeklyScores = await ScoreService.getWeeklyScoresForRank(userId);
      
      // Separate current week (in progress) from completed weeks
      const today = new Date();
      const currentWeekStart = ScoreService.getWeekStartDate(today).toISOString();
      
      // Filter to get only completed weeks (excluding current week)
      const completedWeeks = weeklyScores.filter(score => 
        score.weekStart !== currentWeekStart && score.isComplete
      ).slice(0, 12); // Take up to 12 completed weeks
      
      // Calculate total score from last 12 completed weeks
      const totalScore = completedWeeks.reduce((sum, week) => sum + week.score, 0);
      
      // Get all rank tiers
      const { data: rankTiers } = await client.models.RankTier.list({
        limit: 100 // Get all tiers
      });
      
      // Sort manually by minScore in ascending order
      const sortedTiers = rankTiers.sort((a, b) => a.minScore - b.minScore);
      
      // Find the appropriate tier for the user's score
      let currentTier: RankTier | null = null;
      for (const tier of sortedTiers) {
        if (totalScore >= tier.minScore && totalScore <= tier.maxScore) {
          currentTier = tier;
          break;
        }
      }
      
      // If no tier matched (shouldn't happen with our setup), use the lowest tier
      if (!currentTier && sortedTiers.length > 0) {
        currentTier = sortedTiers[0];
      }
      
      if (!currentTier) {
        throw new Error('Failed to determine rank tier');
      }
      
      if (!currentTier.id) {
        throw new Error('Rank tier ID is missing');
      }
      
      // Calculate progress within the current tier
      const tierRange = currentTier.maxScore - currentTier.minScore;
      const progressInTier = tierRange > 0 
        ? (totalScore - currentTier.minScore) / tierRange 
        : 0;
      
      // Get existing user rank or create a new one
      const { data: existingRanks } = await client.models.UserRank.list({
        filter: { userId: { eq: userId } },
        limit: 1
      });
      
      if (existingRanks.length > 0 && existingRanks[0].id) {
        // Update existing rank
        const { data: updatedRank } = await client.models.UserRank.update({
          id: existingRanks[0].id,
          rankTierId: currentTier.id,
          currentScore: totalScore,
          progressInTier,
          lastCalculatedAt: new Date().toISOString(),
        });
        
        if (!updatedRank) {
          throw new Error('Failed to update user rank');
        }
        
        return updatedRank;
      } else {
        // Create new rank
        const { data: newRank } = await client.models.UserRank.create({
          userId,
          rankTierId: currentTier.id,
          currentScore: totalScore,
          progressInTier,
          lastCalculatedAt: new Date().toISOString(),
        });
        
        if (!newRank) {
          throw new Error('Failed to create user rank');
        }
        
        return newRank;
      }
    } catch (error) {
      console.error('Error calculating and updating rank:', error);
      throw new Error('Failed to calculate and update rank');
    }
  }
  
  // Get user's current rank with populated tier information
  static async getUserRankWithTier(userId: string): Promise<{userRank: UserRank, rankTier: RankTier, nextRankTier: RankTier | null}> {
    try {
      // First, ensure the user has a rank
      await this.calculateAndUpdateRank(userId);
      
      // Get the user's rank
      const { data: ranks } = await client.models.UserRank.list({
        filter: { userId: { eq: userId } },
        limit: 1
      });
      
      if (!ranks[0]) {
        throw new Error('User rank not found');
      }
      
      if (!ranks[0].rankTierId) {
        throw new Error('Rank tier ID is missing from user rank');
      }
      
      // Get the current rank tier
      const { data: currentTier } = await client.models.RankTier.get({ id: ranks[0].rankTierId });
      
      if (!currentTier) {
        throw new Error('Rank tier not found');
      }
      
      // Get all tiers to find the next one
      const { data: allTiers } = await client.models.RankTier.list({
        limit: 100 // Get all tiers
      });
      
      // Sort manually by minScore in ascending order
      const sortedTiers = allTiers.sort((a, b) => a.minScore - b.minScore);
      
      // Find the next tier (if any)
      let nextTier: RankTier | null = null;
      
      if (currentTier.id) {
        const currentTierIndex = sortedTiers.findIndex(tier => tier.id === currentTier.id);
        if (currentTierIndex < sortedTiers.length - 1) {
          nextTier = sortedTiers[currentTierIndex + 1];
        }
      }
      
      return {
        userRank: ranks[0],
        rankTier: currentTier,
        nextRankTier: nextTier
      };
    } catch (error) {
      console.error('Error getting user rank with tier:', error);
      throw new Error('Failed to get user rank with tier');
    }
  }
  
  // Get formatted data for the rank page (weekly progress, etc.)
  static async getRankPageData(userId: string): Promise<RankPageData> {
    try {
      // Get user's rank data
      const rankData = await this.getUserRankWithTier(userId);
      
      // Get weekly scores for chart
      const weeklyScores = await ScoreService.getWeeklyScoresForRank(userId);
      
      // Format weekly scores for the chart
      const formattedWeeklyProgress = weeklyScores.map((score, index) => {
        // We can use this to format the date if needed in the future
        // const weekStart = new Date(score.weekStart);
        // const month = weekStart.toLocaleString('default', { month: 'short' });
        // const day = weekStart.getDate();
        // const weekLabel = `${month} ${day}`;
        
        const weekLabel = `Week ${weeklyScores.length - index}`;
        
        return {
          week: weekLabel,
          score: score.score,
          isCurrentWeek: !score.isComplete
        };
      }).reverse(); // Oldest to newest
      
      // Get current day's score
      const dailyScore = await ScoreService.getDailyScore(userId);
      
      // Get current week's score
      const currentWeekScore = await ScoreService.getCurrentWeekScore(userId);
      
      return {
        rank: rankData.rankTier.name,
        points: rankData.userRank.currentScore,
        previousRank: rankData.rankTier.minScore,
        nextRank: rankData.rankTier.maxScore,
        nextRankName: rankData.nextRankTier?.name || null,
        // check: how to get rid of RANK_TIERS
        previousRankName: RANK_TIERS.find(tier => tier.maxScore === rankData.rankTier.minScore)?.name || null,
        weeklyProgress: formattedWeeklyProgress,
        currentWeekScore: currentWeekScore?.score || 0,
        todayScore: dailyScore?.score || 0,
        todayReflectionCount: dailyScore?.reflectionCount || 0
      };
    } catch (error) {
      console.error('Error getting rank page data:', error);
      throw new Error('Failed to get rank page data');
    }
  }
  
  // Mark weekly scores as complete if the week has ended
  static async updateCompletedWeeks(userId: string): Promise<void> {
    try {
      const today = new Date();
      
      // Get all incomplete weekly scores
      const { data: incompleteScores } = await client.models.WeeklyScore.list({
        filter: {
          userId: { eq: userId },
          isComplete: { eq: false }
        },
        limit: 100 // Get all incomplete scores
      });
      
      // Update scores for weeks that have ended
      for (const score of incompleteScores) {
        if (!score.id) {
          console.warn('Weekly score missing ID, skipping');
          continue;
        }
        
        const weekEnd = new Date(score.weekEnd);
        
        if (today > weekEnd) {
          await client.models.WeeklyScore.update({
            id: score.id,
            isComplete: true,
          });
          
          // Recalculate user rank when a week completes
          await this.calculateAndUpdateRank(userId);
        }
      }
    } catch (error) {
      console.error('Error updating completed weeks:', error);
      throw new Error('Failed to update completed weeks');
    }
  }
}