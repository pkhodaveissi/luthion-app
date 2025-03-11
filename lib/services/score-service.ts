import { amplifyClient as client } from '@/lib/utils/amplify-client-utils';
import { type Schema } from '@/amplify/data/resource';

type DailyScore = Schema['DailyScore']['type'];
type WeeklyScore = Schema['WeeklyScore']['type'];

export class ScoreService {
  // Add points to the daily score
  static async addDailyScore(userId: string, points: number): Promise<DailyScore> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find or create today's weekly score first
      const weeklyScore = await this.getOrCreateCurrentWeeklyScore(userId);
      
      if (!weeklyScore.id) {
        throw new Error('Weekly score ID is missing');
      }
      
      // Find today's daily score or create a new one
      const { data: existingScores } = await client.models.DailyScore.list({
        filter: {
          userId: { eq: userId },
          date: { eq: today.toISOString() }
        },
        limit: 1
      });
      
      const existingScore = existingScores[0];
      
      if (existingScore) {
        if (!existingScore.id) {
          throw new Error('Daily score ID is missing');
        }
        
        // Cap daily score at 40 (per requirements)
        const newScore = Math.min(40, existingScore.score + points);
        
        const { data: updatedScore } = await client.models.DailyScore.update({
          id: existingScore.id,
          score: newScore,
          reflectionCount: existingScore.reflectionCount + 1,
        });
        
        if (!updatedScore) {
          throw new Error('Failed to update daily score');
        }
        
        // Update the weekly score
        const scoreDifference = newScore - existingScore.score;
        if (scoreDifference > 0) {
          await this.updateWeeklyScore(weeklyScore.id, scoreDifference);
        }
        
        return updatedScore;
      } else {
        // Create a new daily score (capped at 40)
        const newScore = Math.min(40, points);
        
        const { data: dailyScore } = await client.models.DailyScore.create({
          userId,
          date: today.toISOString(),
          score: newScore,
          reflectionCount: 1,
          weeklyScoreId: weeklyScore.id,
        });
        
        if (!dailyScore) {
          throw new Error('Failed to create daily score');
        }
        
        // Update the weekly score
        await this.updateWeeklyScore(weeklyScore.id, newScore);
        
        return dailyScore;
      }
    } catch (error) {
      console.error('Error adding daily score:', error);
      throw new Error('Failed to add daily score');
    }
  }
  
  // Get current daily score
  static async getDailyScore(userId: string): Promise<DailyScore | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: scores } = await client.models.DailyScore.list({
        filter: {
          userId: { eq: userId },
          date: { eq: today.toISOString() }
        },
        limit: 1
      });
      
      return scores[0] || null;
    } catch (error) {
      console.error('Error getting daily score:', error);
      throw new Error('Failed to get daily score');
    }
  }
  
  // Helper method to get or create the current week's score record
  static async getOrCreateCurrentWeeklyScore(userId: string): Promise<WeeklyScore> {
    try {
      const today = new Date();
      const weekStart = this.getWeekStartDate(today);
      const weekEnd = this.getWeekEndDate(today);
      
      // Find current week's score
      const { data: existingScores } = await client.models.WeeklyScore.list({
        filter: {
          userId: { eq: userId },
          weekStart: { eq: weekStart.toISOString() }
        },
        limit: 1
      });
      
      if (existingScores[0]) {
        return existingScores[0];
      }
      
      // Create a new weekly score record
      const { data: weeklyScore } = await client.models.WeeklyScore.create({
        userId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        score: 0,
        isComplete: false,
      });
      
      if (!weeklyScore) {
        throw new Error('Failed to create weekly score');
      }
      
      return weeklyScore;
    } catch (error) {
      console.error('Error getting or creating weekly score:', error);
      throw new Error('Failed to get or create weekly score');
    }
  }
  
  // Update weekly score
  static async updateWeeklyScore(weeklyScoreId: string, points: number): Promise<WeeklyScore> {
    try {
      const { data: existingScore } = await client.models.WeeklyScore.get({ id: weeklyScoreId });
      
      if (!existingScore) {
        throw new Error('Weekly score not found');
      }
      
      if (!existingScore.id) {
        throw new Error('Weekly score ID is missing');
      }
      
      // Cap weekly score at 280 (40 points × 7 days)
      const newScore = Math.min(280, existingScore.score + points);
      
      const { data: updatedScore } = await client.models.WeeklyScore.update({
        id: existingScore.id,
        score: newScore,
      });
      
      if (!updatedScore) {
        throw new Error('Failed to update weekly score');
      }
      
      return updatedScore;
    } catch (error) {
      console.error('Error updating weekly score:', error);
      throw new Error('Failed to update weekly score');
    }
  }
  
  // Get all weekly scores for the last 13 weeks
  static async getWeeklyScoresForRank(userId: string): Promise<WeeklyScore[]> {
    try {
      const today = new Date();
      const thirteenWeeksAgo = new Date();
      thirteenWeeksAgo.setDate(today.getDate() - 91); // 13 weeks * 7 days
      
      // Fetch data using filter
      const { data: weeklyScores } = await client.models.WeeklyScore.list({
        filter: {
          userId: { eq: userId },
          weekStart: { ge: thirteenWeeksAgo.toISOString() }
        },
        limit: 100 // Get enough to ensure we have all recent weeks
      });
      
      // Sort manually by weekStart in descending order
      const sortedScores = weeklyScores.sort((a, b) => {
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      });
      
      // Take only the first 13 scores
      return sortedScores.slice(0, 13);
    } catch (error) {
      console.error('Error getting weekly scores for rank:', error);
      throw new Error('Failed to get weekly scores for rank');
    }
  }
  
  // Get current week score
  static async getCurrentWeekScore(userId: string): Promise<WeeklyScore | null> {
    try {
      const today = new Date();
      const weekStart = this.getWeekStartDate(today);
      
      const { data: scores } = await client.models.WeeklyScore.list({
        filter: {
          userId: { eq: userId },
          weekStart: { eq: weekStart.toISOString() }
        },
        limit: 1
      });
      
      return scores[0] || null;
    } catch (error) {
      console.error('Error getting current week score:', error);
      throw new Error('Failed to get current week score');
    }
  }
  
  // Helper method to get the start date of the week (Sunday)
  static getWeekStartDate(date: Date): Date {
    const result = new Date(date);
    result.setDate(date.getDate() - date.getDay()); // Go to Sunday
    result.setHours(0, 0, 0, 0);
    return result;
  }
  
  // Helper method to get the end date of the week (Saturday)
  static getWeekEndDate(date: Date): Date {
    const result = new Date(date);
    result.setDate(date.getDate() + (6 - date.getDay())); // Go to Saturday
    result.setHours(23, 59, 59, 999);
    return result;
  }
  
  // Format date as YYYY-MM-DD
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}