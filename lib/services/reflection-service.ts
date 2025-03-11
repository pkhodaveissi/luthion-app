import { amplifyClient as client } from '@/lib/utils/amplify-client-utils';
import { type Schema } from '@/amplify/data/resource';
import { ScoreService } from './score-service';
import { RankService } from './rank-service';

type ReflectionOption = Schema['ReflectionOption']['type'];
type Reflection = Schema['Reflection']['type'];
type Goal = Schema['Goal']['type'];


interface RecentReflectionWithGoal {
  goal: Goal;
  reflection: Reflection;
  reflectionOption: ReflectionOption;
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
      
      // 6. Update daily score if there's a difference
      if (scoreDifference !== 0) {
        // We need to get the goal to find the reflection date
        const { data: reflection } = await client.models.Reflection.get({ id: reflectionId });
        if (reflection && reflection.goalId) {
          const { data: goal } = await client.models.Goal.get({ id: reflection.goalId });
          if (goal && goal.reflectedAt) {
            // TODO: Handle score update for a specific date (not implemented in this version)
            // For now, we'll just update today's score as a simplification
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
  static async getRecentReflections(userId: string, limit: number = 7): Promise<RecentReflectionWithGoal[]> {
    try {
      // 1. Get goals with reflections for this user
      const { data: goals } = await client.models.Goal.list({
        filter: {
          userId: { eq: userId },
          status: { eq: 'reflected' }
        },
        limit: limit * 2 // Get more than needed to ensure we have enough after filtering
      });
      
      // Sort manually by reflectedAt in descending order
      const sortedGoals = goals
        .filter(goal => goal.reflectedAt) // Ensure reflectedAt exists
        .sort((a, b) => {
          // Safely handle cases where reflectedAt might be undefined
          const dateA = a.reflectedAt ? new Date(a.reflectedAt).getTime() : 0;
          const dateB = b.reflectedAt ? new Date(b.reflectedAt).getTime() : 0;
          return dateB - dateA; // Descending order (newest first)
        })
        .slice(0, limit); // Take only the requested number
      
      // 2. For each goal, get the associated reflection and reflection option
      const result: RecentReflectionWithGoal[] = [];
      
      for (const goal of sortedGoals) {
        if (!goal.id) {
          console.warn('Goal missing ID, skipping');
          continue;
        }
        
        // Get the reflection for this goal
        const { data: reflections } = await client.models.Reflection.list({
          filter: { goalId: { eq: goal.id } },
          limit: 1
        });
        
        if (reflections[0]) {
          const reflection = reflections[0];
          
          if (!reflection.reflectionOptionId) {
            console.warn('Reflection missing option ID, skipping');
            continue;
          }
          
          // Get the reflection option
          const { data: option } = await client.models.ReflectionOption.get({ 
            id: reflection.reflectionOptionId 
          });
          
          if (option) {
            result.push({
              goal,
              reflection,
              reflectionOption: option
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting recent reflections:', error);
      throw new Error('Failed to get recent reflections');
    }
  }
}