"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pen, Loader } from "lucide-react";
import { Goal, useGoal } from "@/lib/hooks/useGoal";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";

// Props type with initialGoal
interface RefinePageProps {
  initialGoal: Goal | null;
  userId: string
}

export default function RefinePage({ initialGoal, userId }: RefinePageProps) {
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
  } = useGoal(initialGoal, userId);

  // Local state for the UI
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Redirect if not in editing state
  useEffect(() => {
    if (!loading && !isEditing) {
      if (!goal) {
        // No goal exists, go to entry page
        router.push('/entry');
      } else if (goal.status === 'committed') {
        console.log('fuck useEffect', goal)
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
    if (!goal?.id || isSubmittingLock || isSubmittingEdit) return;
    
    try {
      setIsSubmittingLock(true);
      
      // Commit the goal to mark it as 'committed'
      await commitGoal(goal.id);
      
      // Navigate after successful commit
      router.push('/entry/committed');
    } catch (err) {
      console.error('Error locking goal:', err);
      setIsSubmittingLock(false);
    }
    // Note: We don't reset the state in finally to avoid the UI flash
  };
  
  // Handle returning to entry for a full edit
  const handleReturnToEntry = async () => {
    if (!goal?.id || isSubmittingLock || isSubmittingEdit) return;
    
    try {
      setIsSubmittingEdit(true);
      
      // Reset the goal for editing
      await resetEditing(goal.id);
      
      // Navigate after successfully resetting
      router.push('/entry');
    } catch (err) {
      console.error('Error resetting goal for editing:', err);
      setIsSubmittingEdit(false);
    }
    // Note: We don't reset the state in finally to avoid the UI flash
  };

  // Handler for when the timer expires
  useEffect(() => {
    if (timeRemaining <= 0 && goal?.id && goal.status === 'draft' && !isSubmittingLock) {
      setIsSubmittingLock(true);
      // Auto-lock the goal when timer expires
      commitGoal(goal.id)
        .then(() => {
          router.push('/entry/committed');
        })
        .catch(err => {
          console.error('Error auto-committing goal:', err);
          setIsSubmittingLock(false);
        });
    }
  }, [timeRemaining, goal, commitGoal, router, isSubmittingLock]);


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
            {/* Edit with Timer Button */}
            <button
              onClick={handleReturnToEntry}
              className="btn btn-wide flex items-center justify-center"
              disabled={timeRemaining <= 0 || isSubmittingLock || isSubmittingEdit}
            >
              {isSubmittingEdit ? (
                <Loader size={32} className="mr-2 animate-spin" />
              ) : (
                <Pen size={32} className="mr-2" />
              )}
              {isSubmittingEdit ? "Editing..." : formatTime(timeRemaining)}
            </button>

            {/* Lock Button */}
            <button
              onClick={handleLockGoal}
              className="btn"
              disabled={isSubmittingLock || isSubmittingEdit}
            >
              {isSubmittingLock ? (
                <Loader size={32} className="animate-spin" />
              ) : (
                <Lock size={32} />
              )}
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