import { amplifyClient as client } from '@/lib/utils/amplify-client-utils';
import { type Schema } from '@/amplify/data/resource';

type Goal = Schema['Goal']['type'];

interface CreateGoalInput {
  text: string;
  userId: string;
}

interface UpdateGoalInput {
  id: string;
  text: string;
}

export class GoalService {
  // Create a new goal with 'draft' status
  static async createGoal({ text, userId }: CreateGoalInput): Promise<Goal> {
    try {
      const { data: goal } = await client.models.Goal.create({
        text,
        userId,
        status: 'draft',
        committedAt: new Date().toISOString(),
      });
      if (!goal) {
        throw new Error('Failed to create goal - returned null');
      }
      return goal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw new Error('Failed to create goal');
    }
  }

  // Update goal text (only allowed in draft status)
  static async updateGoalText({ id, text }: UpdateGoalInput): Promise<Goal> {
    try {
      const { data: existingGoal } = await client.models.Goal.get({ id });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (existingGoal.status !== 'draft') {
        throw new Error('Can only update draft goals');
      }
      const now = new Date().toISOString();
      const { data: updatedGoal } = await client.models.Goal.update({
        id,
        text,
        committedAt: now,
      });
      if (!updatedGoal) {
        throw new Error('Failed to update goal - returned null');
      }
      console.log('fuck inside update', now, updatedGoal)

      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw new Error('Failed to update goal');
    }
  }

  /**
 * Reset a goal's editing state by clearing the committedAt field
 * This allows the user to return to the entry page for full editing
 */
  static async resetGoalEditing(goalId: string): Promise<Goal> {
    try {
      const { data: existingGoal } = await client.models.Goal.get({ id: goalId });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (existingGoal.status !== 'draft') {
        throw new Error('Can only reset editing for draft goals');
      }

      // Update the goal to clear the committedAt timestamp
      const { data: updatedGoal } = await client.models.Goal.update({
        id: goalId,
        committedAt: null,  // Clear the committedAt timestamp
      });

      if (!updatedGoal) {
        throw new Error('Failed to reset goal editing - returned null');
      }
      console.log('fuck inside reset', updatedGoal)

      return updatedGoal;
    } catch (error) {
      console.error('Error resetting goal editing:', error);
      throw new Error('Failed to reset goal editing');
    }
  }

  // Commit a goal - changes status to 'committed'
  static async commitGoal(goalId: string): Promise<Goal> {
    try {
      const { data: existingGoal } = await client.models.Goal.get({ id: goalId });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (existingGoal.status !== 'draft') {
        throw new Error('Can only commit draft goals');
      }

      const { data: committedGoal } = await client.models.Goal.update({
        id: goalId,
        status: 'committed',
        lockedAt: new Date().toISOString(),
      });
      if (!committedGoal) {
        throw new Error('Failed to commit the goal - returned null');
      }
      return committedGoal;
    } catch (error) {
      console.error('Error committing goal:', error);
      throw new Error('Failed to commit goal');
    }
  }

  // Mark goal as reflected and link to reflection
  static async reflectOnGoal(goalId: string, reflectionOptionId: string): Promise<Goal> {
    try {
      // 1️⃣ Fetch the existing Goal
      const { data: existingGoal } = await client.models.Goal.get({ id: goalId });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (existingGoal.status !== 'committed') {
        throw new Error('Can only reflect on committed goals');
      }

      // 2️⃣ Create a new Reflection entry
      const { data: newReflection, errors } = await client.models.Reflection.create({
        goalId,
        reflectionOptionId,
        score: 0,  // Will be updated based on the ReflectionOption
      });

      if (!newReflection || errors) {
        console.error('Failed to create reflection:', errors);
        throw new Error('Failed to create reflection');
      }

      // 3️⃣ Fetch the ReflectionOption to get the associated score
      const { data: reflectionOption } = await client.models.ReflectionOption.get({ id: reflectionOptionId });

      if (!reflectionOption) {
        throw new Error('Invalid reflectionOptionId');
      }

      // 4️⃣ Update the Reflection with the correct score from ReflectionOption
      await client.models.Reflection.update({
        id: newReflection.id,
        score: reflectionOption.score,
      });

      // 5️⃣ Update the Goal status and link to the newly created Reflection
      const { data: reflectedGoal } = await client.models.Goal.update({
        id: goalId,
        status: 'reflected',
        reflectedAt: new Date().toISOString(),
      });

      if (!reflectedGoal) {
        throw new Error('Failed to reflect on goal - returned null');
      }

      return reflectedGoal;
    } catch (error) {
      console.error('Error reflecting on goal:', error);
      throw new Error('Failed to reflect on goal');
    }
  }

  // Get current active goal for user
  static async getCurrentGoal(userId: string): Promise<Goal | null> {
    try {
      const { data: goals } = await client.models.Goal.list({
        filter: {
          userId: { eq: userId },
          or: [
            { status: { eq: 'draft' } },
            { status: { eq: 'committed' } },
          ],
        },
        limit: 1,
      });

      return goals[0] || null;
    } catch (error) {
      console.error('Error getting current goal:', error);
      throw new Error('Failed to get current goal');
    }
  }

  // Get goals for a specific date
  static async getGoalsByDate(userId: string, date: string): Promise<Goal[]> {
    try {
      const { data: goals } = await client.models.Goal.list({
        filter: {
          userId: { eq: userId },
          createdAt: { beginsWith: date }
        }
      });

      return goals;
    } catch (error) {
      console.error('Error getting goals by date:', error);
      throw new Error('Failed to get goals by date');
    }
  }

  // Delete a goal (only if in draft status)
  static async deleteGoal(goalId: string): Promise<void> {
    try {
      const { data: existingGoal } = await client.models.Goal.get({ id: goalId });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      if (existingGoal.status !== 'draft') {
        throw new Error('Can only delete draft goals');
      }

      await client.models.Goal.delete({ id: goalId });
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal');
    }
  }
}