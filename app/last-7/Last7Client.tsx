"use client";

import { useEffect, useState, useRef, JSX } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  RotateCcw,
  Lightbulb,
  Hourglass,
  Pen,
} from "lucide-react";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { ReflectionOption, useReflection } from "@/lib/hooks/useReflection";
import { useScore } from "@/lib/hooks/useScore";
import { GoalWithReflectionData } from "@/lib/services/goal-service-ssr";

interface Last7PageProps {
  userId: string
  initialReflections: GoalWithReflectionData[] | null
  initialReflectionOptions?: ReflectionOption[] | null
}
// Icon map for reflection types
const iconMap: Record<string, JSX.Element> = {
  did_it: <CheckCircle size={32} strokeWidth={1} />, // Completed
  tried_life_happened: <RotateCcw size={32} strokeWidth={1} />, // Retry
  priorities_shifted: <Lightbulb size={32} strokeWidth={1} />, // Idea
  not_today: <Hourglass size={32} strokeWidth={1} />, // Delayed
};

export default function Last7Page({ userId, initialReflections, initialReflectionOptions }: Last7PageProps) {
  const router = useRouter();
  const { recentReflections, reflectionOptions, updateReflection, loading } = useReflection(userId, initialReflections, initialReflectionOptions);
  const { dailyScore, getActivitiesNeededForMax, isMaxedOut } = useScore(userId);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Format reflection options for display
  const formattedOptions = reflectionOptions.map(option => ({
    id: option.id,
    text: `${option.text} (+${option.score})`,
    score: option.score,
    icon: iconMap[option.reflectionType!] || <Hourglass size={32} strokeWidth={1} />,
    reflectionType: option.reflectionType
  }));

  // Close options when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !(optionsRef.current.contains(event.target as Node))) {
        setSelectedEntry(null);
      }
    }

    if (selectedEntry !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEntry]);

  // Handle selection of an entry
  const handleEntryClick = (index: number, event: React.MouseEvent) => {
    if (selectedEntry) {
      setSelectedEntry(null);
    }
    else {
      const entryElement = event.currentTarget;
      const rect = entryElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove = spaceBelow < 317; // Open above if not enough space below
      setSelectedEntry(shouldOpenAbove ? -index - 1 : index + 1); // Store negative index for above
    }
  };

  // Handle selection of a reflection option
  const handleReflectionSelect = async (e: React.MouseEvent, reflectionId: string, optionId: string) => {
    e.stopPropagation();

    const success = await updateReflection(reflectionId, optionId);

    if (success) {
      setSelectedEntry(null);
    }
  };

  // If page is still loading, show loading state
  if (loading) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Daily Score Summary */}
      <div className="text-sm text-text-secondary mb-2">
        <p>
          Today&apos;s score: {dailyScore}/40
          {isMaxedOut
            ? " (Max score reached for today!)"
            : ` (${getActivitiesNeededForMax()} more activities needed to reach max)`}
        </p>
      </div>

      <BlurContainer>
        {/* List container */}
        <div
          ref={optionsRef}
          className="flex flex-col grow gap-3 pb-4 justify-end relative">
          {recentReflections.length === 0 && (
            <div className="text-center text-text-secondary py-6">
              <p>No reflections yet.</p>
              <p>Start by adding goals and reflecting on them!</p>
            </div>
          )}

          {recentReflections.map((entry, index) => {
            const isSelected = Math.abs(selectedEntry!) === index + 1;
            const openAbove = selectedEntry! < 0;
            return (
              <div
                key={entry.reflectionId}
                className={`relative flex flex-col w-full p-4 border border-border/30 rounded-sm transition-all duration-200 cursor-pointer
                  ${selectedEntry !== null && !isSelected ? "blur-sm opacity-0 pointer-events-none" : ""}
                `}
                onClick={(event) => handleEntryClick(index, event)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg italic flex-1">{entry.goalText}</p>
                  {iconMap[entry.reflectionType] || <Hourglass size={32} strokeWidth={1} />}
                </div>

                {/* Show reflection options when an item is selected */}
                {isSelected && (
                  <div
                    className={`absolute left-0 w-full flex flex-col gap-y-2 mt-2 bg-background p-3 rounded-sm shadow-lg transition-all duration-200 z-10
                      ${openAbove ? "bottom-full mb-2" : "top-full mt-2"}
                    `}
                  >
                    {formattedOptions.map((option) => (
                      <button
                        key={option.id}
                        className="btn flex items-center justify-start w-full"
                        onClick={(e) => handleReflectionSelect(e, entry.reflectionId, option.id!)}
                      >
                        {option.icon}
                        <span className="ml-2">{option.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {recentReflections.length > 0 && (
            <div className="text-text-muted text-center text-sm pb-2 opacity-80">--- Latest ---</div>
          )}
        </div>
      </BlurContainer>

      {/* Navigation and Action Buttons */}
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
            {/* Nav Button */}
            <MainNavButton />
          </div>
        </BlurContainer>
        <MainNavDrawer />
      </div>
    </>
  );
}