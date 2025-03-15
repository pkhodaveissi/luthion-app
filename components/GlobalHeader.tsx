import { getRankPageData } from "@/lib/services/goal-service-ssr";
import { getAppUserServer } from "@/lib/utils/amplify-server-utils";
import Image from "next/image";
import { redirect } from "next/navigation";


export default async function GlobalHeader() {
  // Get authenticated user
  const userId = (await getAppUserServer())?.id;
  // Redirect to login if no user
  if (!userId) {
    redirect('/login');
    return null;
  }


  // Fetch initial goal data
  const initialRankData = await getRankPageData(userId);
  return (
    <header className="flex flex-col items-center mb-4">
      <Image src={`/badges/${initialRankData.rank}.svg`} alt="Rank Badge" width={60} height={52} unoptimized />
    </header>
  );
}
