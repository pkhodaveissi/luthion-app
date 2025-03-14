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
    return goals[0] as Goal || null;
  } catch (error) {
    console.error('Server error getting initial goal data:', error);
    return null;
  }
}

export async function getInitialReflectionData(userId: string, limit: number = 7) {
  try {
    // check: if we can use reflection-service
    const { data: goalsWithReflections } = await amplifyCookiesClient.models.Goal.listGoalsByUserOrderedbyReflection({
      userId: userId,
    }, {
      sortDirection: 'DESC',
      selectionSet: ['id', 'reflectedAt', 'userId', 'text', 'reflection.*', 'reflection.reflectionOption.*'],
      limit,
    });
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

export type RankPageData = {
  rank?: string
  points: number
  previousRank: number
  nextRank: number
  nextRankName?: string | null
  previousRankName?: string | null
  weeklyProgress?: {
    week: string;
    score: number;
    isCurrentWeek: boolean;
  }[],
  currentWeekScore?: number
  todayScore?: number
  todayReflectionCount?: number
}
export async function getRankPageData(userId: string): Promise<RankPageData> {
  try {
    // Get user's rank data
    const { data: rankData } = await amplifyCookiesClient.models.User.get({
      id: userId
    },
      {
        selectionSet: [
          'id',
          'userRank.currentScore',
          'userRank.rankTier.name',
          'userRank.rankTier.nextRankName',
          'userRank.rankTier.previousRankName',
          'userRank.rankTier.minScore',
          'userRank.rankTier.maxScore',
          'dailyScores.*'
        ],
      });

    return {
      rank: rankData?.userRank.rankTier.name,
      points: rankData?.userRank.currentScore || 0,
      previousRank: rankData?.userRank.rankTier.minScore || 0,
      nextRank: rankData?.userRank.rankTier.maxScore || 0,
      nextRankName: rankData?.userRank.rankTier.nextRankName,
      previousRankName: rankData?.userRank.rankTier.previousRankName,
    };
  } catch (error) {
    console.error('Error getting rank page data:', error);
    throw new Error('Failed to get rank page data');
  }
}

// const selectionSet = [
//   'id', 
//   'userRank.currentScore', 
//   'userRank.rankTier.name', 
//   'userRank.rankTier.nextRankName', 
//   'userRank.rankTier.previousRankName', 
//   'userRank.rankTier.minScore', 
//   'userRank.rankTier.maxScore',
//   'dailyScores.*'
// ] as const;
// type RankPageData = SelectionSet<Schema['User']['type'], typeof selectionSet>;