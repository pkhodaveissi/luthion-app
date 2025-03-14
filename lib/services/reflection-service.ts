import { amplifyClient as client } from '@/lib/utils/amplify-client-utils';
import { type Schema } from '@/amplify/data/resource';
import { ScoreService } from './score-service';
import { RankService } from './rank-service';

type ReflectionOption = Schema['ReflectionOption']['type'];
type Reflection = Schema['Reflection']['type'];
type ReflectionOptionForReflected = {
  id: string;
  text: string;
  score: number;
  isActive: boolean;
  reflectionType: 'tried_life_happened' | 'priorities_shifted' | 'not_today' | 'did_it';
}

type ReflectionForReflected = {
  id: string;
  goalId: string;
  reflectionOptionId: string;
  score: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  reflectionOption: ReflectionOptionForReflected;
}

export type ReflectedGoal = {
  id: string;
  userId: string;
  text: string;
  reflectedAt: string | Date;
  reflection: ReflectionForReflected;
}

export class ReflectionService {

  // Get all reflection options
  static async getReflectionOptions(): Promise<ReflectionOption[]> {
    try {
      const { data: options } = await client.models.ReflectionOption.list({
        filter: { isActive: { eq: true } },
        limit: 100 // Get all active options
      });
      return options;
    } catch (error) {
      console.error('Error getting reflection options:', error);
      throw new Error('Failed to get reflection options');
    }
  }

  // Reflect on a goal and update scores
  static async reflectOnGoal(goalId: string, reflectionOptionId: string, userId: string): Promise<Reflection> {
    try {
      // 1. Fetch the goal
      const { data: goal } = await client.models.Goal.get({ id: goalId });
      if (!goal) {
        throw new Error('Goal not found');
      }

      if (!goal.id) {
        throw new Error('Goal ID is missing');
      }

      // 2. Fetch the reflection option to get score
      const { data: option } = await client.models.ReflectionOption.get({ id: reflectionOptionId });
      if (!option) {
        throw new Error('Reflection option not found');
      }

      // 3. Create the reflection
      const { data: reflection } = await client.models.Reflection.create({
        goalId,
        reflectionOptionId,
        score: option.score,
      });

      if (!reflection) {
        throw new Error('Failed to create reflection');
      }

      // 4. Update the goal status
      await client.models.Goal.update({
        id: goal.id,
        status: 'reflected',
        reflectedAt: new Date().toISOString(),
      });

      // 5. Update daily score
      await ScoreService.addDailyScore(userId, option.score);

      // 6. Update completed weeks and recalculate rank
      await RankService.updateCompletedWeeks(userId);
      await RankService.calculateAndUpdateRank(userId);

      return reflection;
    } catch (error) {
      console.error('Error reflecting on goal:', error);
      throw new Error('Failed to reflect on goal');
    }
  }

  // Update an existing reflection
  static async updateReflection(reflectionId: string, newReflectionOptionId: string, userId: string): Promise<Reflection> {
    try {
      // 1. Fetch the existing reflection
      const { data: existingReflection } = await client.models.Reflection.get({ id: reflectionId });
      if (!existingReflection) {
        throw new Error('Reflection not found');
      }

      if (!existingReflection.id) {
        throw new Error('Reflection ID is missing');
      }

      // 2. Fetch the old reflection option to get the old score
      const { data: oldOption } = await client.models.ReflectionOption.get({ id: existingReflection.reflectionOptionId });
      if (!oldOption) {
        throw new Error('Old reflection option not found');
      }

      // 3. Fetch the new reflection option to get the new score
      const { data: newOption } = await client.models.ReflectionOption.get({ id: newReflectionOptionId });
      if (!newOption) {
        throw new Error('New reflection option not found');
      }

      // 4. Calculate score difference
      const scoreDifference = newOption.score - oldOption.score;

      // 5. Update the reflection
      const { data: updatedReflection } = await client.models.Reflection.update({
        id: existingReflection.id,
        reflectionOptionId: newReflectionOptionId,
        score: newOption.score,
      });

      if (!updatedReflection) {
        throw new Error('Failed to update reflection');
      }

      // 6. Update score for the specific date if there's a difference
      if (scoreDifference !== 0) {
        // Get the goal to find the reflection date
        const { data: reflection } = await client.models.Reflection.get({ id: reflectionId });
        if (reflection && reflection.goalId) {
          const { data: goal } = await client.models.Goal.get({ id: reflection.goalId });
          if (goal && goal.reflectedAt) {
            // Update the score for the day when the reflection was originally made
            const reflectionDate = new Date(goal.reflectedAt);
            await ScoreService.updateHistoricalDailyScore(userId, reflectionDate, scoreDifference);
          } else {
            // Fallback to updating today's score if no reflection date is available
            console.warn('No reflection date found, updating today\'s score instead');
            await ScoreService.addDailyScore(userId, scoreDifference);
          }
        }
      }

      // 7. Recalculate rank
      await RankService.calculateAndUpdateRank(userId);

      return updatedReflection;
    } catch (error) {
      console.error('Error updating reflection:', error);
      throw new Error('Failed to update reflection');
    }
  }

  // Get recent reflections with associated goals
  static async getRecentReflections(userId: string, limit: number = 7): Promise<ReflectedGoal[]> {
    try {
      // 1. Get goals with reflections for this user
      const { data: goals } = await client.models.Goal.listGoalsByUserOrderedbyReflection({
        userId: userId,
      }, {
        sortDirection: 'DESC',
        selectionSet: ['id', 'reflectedAt', 'userId', 'text', 'reflection.*', 'reflection.reflectionOption.*'],
        limit: limit
      });

      return goals as unknown as ReflectedGoal[];
    } catch (error) {
      console.error('Error getting recent reflections:', error);
      throw new Error('Failed to get recent reflections');
    }
  }
}