// app/entry/committed/page.tsx
import { getAppUserServer } from '@/lib/utils/amplify-server-utils';
import { getInitialReflectionData, getInitialReflectionOptionData, GoalWithReflectionData } from '@/lib/services/goal-service-ssr';
import { redirect } from 'next/navigation';
import Last7Client from './Last7Client'; // Import the client component
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/utils/get-query-client';

export default async function Last7Server() {

  const queryClient = getQueryClient()
  // Get authenticated user
  const userId = (await getAppUserServer())?.id;
  // Redirect to login if no user
  if (!userId) {
    redirect('/login');
    return null;
  }

  let initialReflections: GoalWithReflectionData[] | null = null;
  const initialReflectionOptions = await getInitialReflectionOptionData();
  // Fetch initial goal data
  if (userId) {
    initialReflections = await getInitialReflectionData(userId);
  }

  // Pass the pre-fetched data to the client component
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Last7Client userId={userId} initialReflections={initialReflections} initialReflectionOptions={initialReflectionOptions} />
    </HydrationBoundary>
  );
}