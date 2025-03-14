import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import EntryPageClient from './EntryPageClient';
import { getInitialGoalData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
export default async function EntryPage() {

  let initialGoal = null;
  
  const user = (await getAppUserServer());
  const userId = user?.id;
   // Redirect to login if no user
   if (!userId) {
    redirect('/login?signed_out=true'); 
    return null;
  }
  if (user?.id) {
    initialGoal = await getInitialGoalData(user.id);
  }
  return <EntryPageClient initialGoal={initialGoal} userId={userId} />;
}