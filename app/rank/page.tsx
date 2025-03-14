// app/entry/committed/page.tsx
import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import { getRankPageData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
import RankPageClient from './RankPageClient'; // Import the client component

export default async function RankServer() {
   // Get authenticated user
   const userId = (await getAppUserServer())?.id;
   // Redirect to login if no user
  if (!userId) {
   redirect('/login'); 
   return null;
  }
  
  
  // Fetch initial goal data
    const initialRankData = await getRankPageData(userId);
  
  // Pass the pre-fetched data to the client component
  return <RankPageClient userId={userId} initialRankData={initialRankData} />;
}