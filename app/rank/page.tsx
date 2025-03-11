"use client";

import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { Pen } from "lucide-react";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { useRouter } from "next/navigation";
import { useRank } from "@/lib/hooks/useRank";
import { useScore } from "@/lib/hooks/useScore";




export default function RankPage() {
  const router = useRouter();
  const { rankData, loading, getProgressInTierPercentage } = useRank();
  const { getActivitiesNeededForMax, isMaxedOut } = useScore();
  console.log('fuck: rank data', rankData)

  if (loading || !rankData) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
      <div className="flex flex-col items-center text-center rounded-sm shadow-border px-6 pt-6">
        <Image src={`/badges/${rankData!.rank.toLowerCase()}.svg`} alt="Rank Badge" width={110} height={110} className="mb-2" />
        <h1 className="text-3xl font-bold">{rankData!.rank}</h1>
        <div className="w-full max-w-md pb-2">
          <div className="flex justify-between text-sm text-text-secondary font-semibold">
            <span>{rankData!.previousRank}</span>
            <span>{rankData!.nextRank}</span>
          </div>
          <div className="relative w-full h-4 bg-surface rounded-sm overflow-hidden mt-1">
            <div className="h-full bg-foreground" style={{ width: `${getProgressInTierPercentage()}%` }}></div>
          </div>
          <div className="flex justify-between text-sm text-text-secondary mt-1 font-semibold">
            <span>Steady</span>
            <span>Momentum</span>
          </div>
        </div>
      </div>

      <div className="w-full h-40 mt-4">
        <p className="text-sm pb-3 pt-0">Your Rank is calculated based on <span className="font-bold">sum of all your points over the preceding 12 completed weeks.</span></p>
        <ResponsiveContainer width="100%" height="100%" className="mb-2">
          <BarChart data={rankData?.weeklyProgress} barSize={16}>
            <XAxis dataKey="week" hide />
            <YAxis domain={[0, 40]} tickCount={3} width={24} />
            <Bar dataKey="score" fill="#D9D9D9" background={{ fill: '#1C1C1C' }} radius={2} />
            <CartesianGrid strokeDasharray="2" horizontalCoordinatesGenerator={(props) => {
              const step = (props.height - 4) / 4; // Divide height into 4 equal spaces
              return Array.from({ length: 3 }, (_, i) => (i + 1) * step);
            }} vertical={false} className="opacity-40" />
          </BarChart>
        </ResponsiveContainer>
        <div>
          <h3 className="text-left text-xl font-medium">This Week</h3>
          <div className="relative w-full h-4 bg-surface rounded-sm overflow-hidden mt-1">
            <div className="h-full bg-foreground" style={{ width: `${(rankData!.currentWeekScore / 280) * 100}%` }}></div>
          </div>
          <p className="text-sm pb-3 pt-2">Current week’s progress as can see above <span className="font-bold">will become part of your rank once it’s completed.</span> It’s capped at 280.</p>
        </div>
        <div>
          <h3 className="text-left text-xl font-medium">Today</h3>
          <div className="relative w-full h-4 bg-surface rounded-sm overflow-hidden mt-1">
            <div className="h-full bg-foreground" style={{ width: `${(rankData.todayScore / 40) * 100}%` }}></div>
          </div>
          <p className="text-sm pb-3 pt-2">Today’s progress can be tracked above, it has a max of 40 and it will hit that point by successfully completing 8 activities. Each successful activity will contribute 5 scores to your progress.
            <span className="font-bold">
              {isMaxedOut ?
                ' You\'ve reached the maximum score for today!' :
                ` You need ${getActivitiesNeededForMax()} more activities to reach the maximum.`
              }
            </span>
          </p>
        </div>
      </div>


      {/* Navigation */}
      <div className="relative w-full">
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            <button
              onClick={() => router.push("/entry")}
              className="btn btn-wide flex items-center justify-center"
            >
              <Pen size={32} className="mr-2" />
              What Matters Now?
            </button>
            <MainNavButton />
          </div>
        </BlurContainer>
        <MainNavDrawer />
      </div>
    </div>
  );
}
