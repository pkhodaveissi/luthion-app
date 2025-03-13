import { amplifyCookiesClient } from '@/lib/utils/amplify-server-utils';
import { type Schema } from '@/amplify/data/resource';


type Goal = Schema['Goal']['type'];
type ReflectionOption = Schema['ReflectionOption']['type'];
/**
 * Server-side functions for goal data
 * These are designed to be used in Server Components
 */
export async function getInitialGoalData(userId: string): Promise<Goal | null> {
  try {
    const { data: goals } = await amplifyCookiesClient.models.Goal.list({
      filter: {
        userId: { eq: userId },
        or: [{ status: { eq: 'draft' } }, { status: { eq: 'committed' } }],
      },
      selectionSet: ['id', 'userId', 'text', 'status', 'createdAt', 'committedAt', 'lockedAt', 'reflectedAt', 'updatedAt', 'owner'],
    });
    console.log('fuck initial ssr', goals)
    return goals[0] as Goal || null;
  } catch (error) {
    console.error('Server error getting initial goal data:', error);
    return null;
  }
}

export async function getInitialReflectionData(userId: string, limit: number = 7 ) {
  try {
    // check: if we can use reflection-service
    const { data: goalsWithReflections } = await amplifyCookiesClient.models.Goal.listGoalsByUserOrderedbyReflection({
      userId: userId,
    }, {
      sortDirection: 'DESC',
      selectionSet: ['id', 'reflectedAt', 'userId', 'text', 'reflection.*', 'reflection.reflectionOption.*'],
      limit,
    });
    // check: add secondary index for reflectedAt to sort on database level 
    console.log('fuck initial ssr reflections', goalsWithReflections)
    return goalsWithReflections
  } catch (error) {
    console.error('Server error getting initial goal data:', error);
    return null;
  }
}
export async function getInitialReflectionOptionData(): Promise<ReflectionOption[] | null> {
  try {
    // check: if we can use reflection-service
    const { data: reflectionOptions } = await amplifyCookiesClient.models.ReflectionOption.list(
      {
        selectionSet: ['id',
          'text',
          'score',
          'isActive',
          'reflectionType'],
      }
    );
    // check: add secondary index for reflectedAt to sort on database level 
    return reflectionOptions as ReflectionOption[]
  } catch (error) {
    console.error('Server error getting initial goal data:', error);
    return null;
  }
}
// export async function getUserGoalHistory(userId: string, limit = 7): Promise<Goal[]> {
//   try {
//     const { data: goals } = await amplifyCookiesClient.models.Goal.list({
//       filter: {
//         userId: { eq: userId },
//         status: { eq: 'reflected' }
//       },
//       limit,
//       sortDirection: { field: 'createdAt', direction: 'DESC' }
//     });
    
//     return goals;
//   } catch (error) {
//     console.error('Server error getting goal history:', error);
//     return [];
//   }
// }