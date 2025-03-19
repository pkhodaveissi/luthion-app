import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import EntryPageClient from './EntryPageClient';
import { getInitialGoalData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
import { getQueryClient } from '@/lib/utils/get-query-client';

export default async function EntryPage() {
  const queryClient = getQueryClient()
  let initialGoal = null;
  
  const user = (await getAppUserServer());
  const userId = user?.id;
   // Redirect to login if no user
   if (!userId) {
    redirect('/login?signed_out=true'); 
    return null;
  }
  if (user?.id) {
    initialGoal = await getInitialGoalData(user.id, 'entry');
  }
    
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntryPageClient initialGoal={initialGoal} userId={userId} />
      </HydrationBoundary>
  );
}