"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pen } from "lucide-react";
import { useGoal } from "@/lib/hooks/useGoal";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";

export default function RefinePage() {
  const router = useRouter();
  const {
    goal,
    loading,
    error,
    timeRemaining,
    commitGoal,
    isEditing,
    refreshGoal,
    resetEditing
  } = useGoal();

  // Local state for the textarea (only used if we make it editable)
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Redirect if not in editing state
  useEffect(() => {
    if (!loading && !isEditing) {
      if (!goal) {
        // No goal exists, go to entry page
        router.push('/entry');
      } else if (goal.status === 'committed') {
        // Goal is already committed
        router.push('/entry/committed');
      } else if (goal.status === 'reflected') {
        // Goal is completed, start a new one
        router.push('/entry');
      }
    }
  }, [loading, goal, isEditing, router]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Lock/commit the goal
  const handleLockGoal = async () => {
    try {
      setIsSubmitting(true);
      
      // No need to update the text here since we're displaying it as read-only
      // If you decide to make it editable, uncomment this:
      // if (goalText.trim() !== goal?.text) {
      //   await updateGoalText(goalText);
      // }
      
      // Commit the goal to mark it as 'committed'
      if (goal?.id) {
        console.log('fuck, handle lock')

        await commitGoal(goal.id);
        router.push('/entry/committed');
      }
    } catch (err) {
      console.error('Error locking goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle returning to entry for a full edit - we need to reset committedAt
  const handleReturnToEntry = async () => {
    try {
      setIsSubmitting(true);
      
      if (goal?.id) {
        // Use the resetEditing function from the hook to clear committedAt
        await resetEditing(goal.id);
        router.push('/entry');
      }
    } catch (err) {
      console.error('Error resetting goal for editing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for when the timer expires
  useEffect(() => {
    if (timeRemaining <= 0 && goal?.id && goal.status === 'draft') {
      // Auto-lock the goal when timer expires
      console.log('fuck time not remaining', timeRemaining)
      commitGoal(goal.id).then(() => {
        router.push('/entry/committed');
      });
    }
  }, [timeRemaining, goal, commitGoal, router]);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
        <GlobalHeader />
        <BlurContainer>
          <div className="flex justify-center items-center h-full">
            <p>Loading...</p>
          </div>
        </BlurContainer>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
        <GlobalHeader />
        <BlurContainer>
          <div className="flex flex-col justify-center items-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={refreshGoal} className="btn">
              Try Again
            </button>
          </div>
        </BlurContainer>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      <GlobalHeader />

      <BlurContainer>
        {/* Goal Display (Non-editable) */}
        <div className="flex flex-col justify-start items-start text-left h-full pb-4">
          <p className="text-xl italic text-text-primary">{goal?.text}</p>
        </div>
      </BlurContainer>

      <div className="relative w-full">
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            {/* Edit with Timer */}
            <button
              onClick={handleReturnToEntry}
              className={`btn btn-wide flex items-center justify-center ${
                timeRemaining <= 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={timeRemaining <= 0 || isSubmitting}
            >
              <Pen size={32} className="mr-2" />
              {formatTime(timeRemaining)}
            </button>

            {/* Lock Button */}
            <button
              onClick={handleLockGoal}
              className="btn"
              disabled={isSubmitting}
            >
              <Lock size={32} />
            </button>

            {/* Nav Button */}
            <MainNavButton />
          </div>
        </BlurContainer>

        <MainNavDrawer />
      </div>
    </div>
  );
}