// /app/entry/committed/CommittedPageClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Lightbulb, Hourglass, CheckCircle, Crop, X, Loader } from "lucide-react";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { Goal, useGoal } from "@/lib/hooks/useGoal";
import { useReflection } from "@/lib/hooks/useReflection";
import { useScore } from "@/lib/hooks/useScore";

interface CommittedPageClientProps {
  initialGoal: Goal | null;
  userId: string
}

export default function CommittedPageClient({ initialGoal, userId }: CommittedPageClientProps) {
  const router = useRouter();
  const { goal, error, refreshGoal } = useGoal(userId, initialGoal);
  const { reflectionOptions, reflectOnGoal } = useReflection(userId);
  const { dailyScore, getActivitiesNeededForMax, isMaxedOut } = useScore(userId);
  
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
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
    if (!goal?.id || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setSelectedOptionId(optionId);
      
      const success = await reflectOnGoal(goal.id, optionId);
      
      if (success) {
        // Keep the loading state active and don't reset it to avoid UI flash
        router.push("/last-7");
      } else {
        // Only reset if there's an error
        setIsSubmitting(false);
        setSelectedOptionId(null);
      }
    } catch (err) {
      console.error("Error reflecting on goal:", err);
      setIsSubmitting(false);
      setSelectedOptionId(null);
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

  // Redirect if not in committed state
  useEffect(() => {
    if (goal && goal.status !== 'committed') {
      if (goal.status === 'draft' && !goal.committedAt) {
        router.push("/entry");
      } else if (goal.status === 'draft' && goal.committedAt) {
        router.push("/entry/refine");
      } else if (goal.status === 'reflected' || !goal) {
        router.push("/entry");
      }
    }
  }, [goal, router]);

  // Error state
  if (error) {
    return (
      <>
        <BlurContainer>
          <div className="flex flex-col justify-center items-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={refreshGoal} className="btn">
              Try Again
            </button>
          </div>
        </BlurContainer>
      </>
    );
  }

  return (
    <>
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
            <p className="text-xl italic text-text-primary">{goal?.text}</p>
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
                disabled={isSubmitting}
              >
                {isSubmitting && selectedOptionId === option.id ? (
                  <Loader size={32} className="animate-spin" />
                ) : (
                  option.icon
                )}
                <span className="ml-2">
                  {isSubmitting && selectedOptionId === option.id 
                    ? `Reflecting...` 
                    : option.text}
                </span>
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
                disabled={isSubmitting}
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
    </>
  );
}