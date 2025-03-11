"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Lightbulb, Hourglass, CheckCircle, Crop, X } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { useGoal } from "@/lib/hooks/useGoal";
import { useReflection } from "@/lib/hooks/useReflection";
import { useScore } from "@/lib/hooks/useScore";

export default function ReflectPage() {
  const router = useRouter();
  const { goal, loading: goalLoading } = useGoal();
  const { reflectionOptions, reflectOnGoal, loading: reflectionLoading } = useReflection();
  const { dailyScore, getActivitiesNeededForMax, isMaxedOut } = useScore();
  
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Map reflection types to icons
  const iconMap = {
    tried_life_happened: <RotateCcw size={32} strokeWidth={1} />,
    priorities_shifted: <Lightbulb size={32} strokeWidth={1} />,
    not_today: <Hourglass size={32} strokeWidth={1} />,
    did_it: <CheckCircle size={32} strokeWidth={1} />
  };

  // Format reflection options with score
  const formattedOptions = reflectionOptions.map(option => ({
    id: option.id,
    text: `${option.text} (+${option.score})`,
    score: option.score,
    icon: iconMap[option.reflectionType as keyof typeof iconMap],
    reflectionType: option.reflectionType
  }));

  // Handle selection
  const handleSelect = async (optionId: string) => {
    if (!goal) return;
    
    const success = await reflectOnGoal(goal.id!, optionId);
    
    if (success) {
      setShowOptions(false);
      router.push("/last-7");
    }
  };

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  // If no committed goal exists, redirect to entry
  useEffect(() => {
    if (!goalLoading && (!goal || goal.status !== 'committed')) {
      router.push("/entry");
    }
  }, [goal, goalLoading, router]);

  // If page is still loading, show loading state
  if (goalLoading || reflectionLoading || !goal) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
        <GlobalHeader />
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
      <GlobalHeader />
      {/* Goal Display (Non-editable) */}

      <BlurContainer>
      <div className="flex flex-col">
      <div className="text-sm text-text-secondary mb-2">
        <p>
          Today&apos;s score: {dailyScore}/40
          {isMaxedOut 
            ? " (Max score reached for today!)" 
            : ` (${getActivitiesNeededForMax()} more activities needed to reach max)`}
        </p>
      </div>
        <div className="flex flex-col justify-start items-start text-left h-full pb-4">
          <p className="text-xl italic text-text-primary">{goal.text}</p>
        </div>
      </div>
      </BlurContainer>

      {/* Action Buttons */}
      <div className="flex w-full flex-col items-center gap-y-2" ref={optionsRef}>
        {/* Reflection Options (Expanding Above the Reflect Button) */}
        {showOptions && (
          <div className="w-full flex flex-col gap-y-2 mb-2 transition-all duration-200">
            {formattedOptions.map((option) => (
              <button
                key={option.id}
                className="btn flex items-center justify-start w-full"
                onClick={() => handleSelect(option.id!)}
              >
                {option.icon}
                <span className="ml-2">{option.text}</span>
              </button>
            ))}
          </div>
        )}
        <div className="relative w-full">
        {/* 
          Wrap ONLY what you want blurred in <BlurContainer>. 
          By leaving MainNavDrawer outside it, the drawer remains clear. 
        */}
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            {/* Reflect Button (Toggles Options) */}
            <button
              onClick={() => setShowOptions((prev) => !prev)}
              className="btn btn-wide flex items-center justify-center"
            >
              {showOptions ? <X size={32} className="mr-2" /> : <Crop size={32} className="mr-2" />}
              Reflect
            </button>
            <MainNavButton />
          </div>
        </BlurContainer>
        {/* Nav Button */}
        <MainNavDrawer />
        </div>
      </div>
    </div>
  );
}