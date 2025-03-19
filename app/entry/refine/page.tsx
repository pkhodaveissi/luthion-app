// app/entry/refine/page.tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import { getInitialGoalData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
import { getQueryClient } from '@/lib/utils/get-query-client';
import RefinePageClient from './RefinePageClient'; // Import the client component

export default async function RefinePageServer() {
  const queryClient = getQueryClient()
  // Get authenticated user
  const userId = (await getAppUserServer())?.id;
  // Redirect to login if no user
  if (!userId) {
    redirect('/login');
    return null;
  }

  let initialGoal = null;
  // Fetch initial goal data
  if (userId) {
    initialGoal = await getInitialGoalData(userId, 'refine');
  }
  // Redirect if no goal exists or if it's not in editing state
  if (!initialGoal) {
    redirect('/entry');
  }

  // Check if the goal is in the correct state (draft with committedAt)
  if (initialGoal.status !== 'draft' || !initialGoal.committedAt) {
    if (initialGoal.status === 'committed') {
      redirect('/entry/committed');
    } else {
      redirect('/entry');
    }
  }
  // Pass the pre-fetched data to the client component
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RefinePageClient initialGoal={initialGoal} userId={userId} />
    </HydrationBoundary>
  );
}