// app/entry/committed/page.tsx
import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import { getInitialGoalData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
import CommittedPageClient from './CommittedPageClient'; // Import the client component

export default async function CommittedPageServer() {
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
    initialGoal = await getInitialGoalData(userId, 'committed');
  }
  
  // Redirect if no goal exists
  if (!initialGoal) {
    redirect('/entry');
  }
  
  // Check if the goal is in the correct state (committed)
  if (initialGoal.status !== 'committed') {
    if (initialGoal.status === 'draft' && initialGoal.committedAt) {
      redirect('/entry/refine');
    } else {
      redirect('/entry');
    }
  }
  
  // Pass the pre-fetched data to the client component
  return <CommittedPageClient initialGoal={initialGoal} userId={userId} />;
}