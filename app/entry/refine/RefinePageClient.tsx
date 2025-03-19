"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pen, Loader } from "lucide-react";
import { useCurrentGoal, useGoalMutations } from "@/lib/hooks/useGoalQuery";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { type Schema } from '@/amplify/data/resource';

type Goal = Schema['Goal']['type'];

interface RefinePageProps {
  initialGoal: Goal | null;
  userId: string;
}

// Function to calculate time remaining from committedAt timestamp
const calculateTimeRemaining = (committedAt?: string | null) => {
  if(!committedAt) return 300
  try {
    const committedTime = new Date(committedAt).getTime();
    const fiveMinutesLater = committedTime + (5 * 60 * 1000); // 5 minutes in milliseconds
    const now = Date.now();
    const remainingMs = Math.max(0, fiveMinutesLater - now);
    const remainingSecs = Math.ceil(remainingMs / 1000);
    return remainingSecs;
  } catch (e) {
    console.error("Error calculating time remaining:", e);
    return 300; // Default to 5 minutes
  }
};

export default function RefinePageClient({ initialGoal, userId }: RefinePageProps) {
  const router = useRouter();

  // Use the TanStack Query hooks with SSR initial data
  const { data: goal, isLoading, error } = useCurrentGoal(userId, initialGoal);

  const {
    commitGoal,
    resetEditing,
    isLoading: isMutating,
    error: mutationError
  } = useGoalMutations(userId);

  // State for UI submission states
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Calculate time remaining for editing
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(initialGoal?.committedAt)); // 5 minutes in seconds




  // Debug initial data
  useEffect(() => {
    console.log("Initial goal data:", {
      initialGoalExists: !!initialGoal,
      isLoading,
      isMutating,
      currentGoalExists: !!goal
    });

  }, [initialGoal, isLoading, isMutating, goal]);

  // Initialize timer from initial goal if possible
  useEffect(() => {
    // Try to initialize from initialGoal if available
    if (initialGoal?.committedAt && initialGoal.status === 'draft') {
      console.log("Initializing timer from initialGoal");
      const initialTime = calculateTimeRemaining(initialGoal.committedAt);
      setTimeRemaining(initialTime);
    }
  }, []);

  // Handle timer calculation
  useEffect(() => {
    // Check each condition individually and log it
    if (!goal?.id) {
      console.log("Timer not starting - goal ID is missing");
      return;
    }

    // We don't need createdAt for the timer
    // if (!goal?.createdAt) {
    //   console.log("Timer not starting - createdAt is missing");
    //   return;
    // }

    if (goal.status !== 'draft') {
      console.log("Timer not starting - status is not 'draft':", goal.status);
      return;
    }

    if (!goal.committedAt) {
      console.log("Timer not starting - committedAt is missing");
      return;
    }

    console.log("Timer starting for goal:", goal.id);

    // Calculate time based on committedAt timestamp
    const committedTime = new Date(goal.committedAt).getTime();
    const fiveMinutesLater = committedTime + (5 * 60 * 1000); // 5 minutes in milliseconds
    const now = Date.now();
    const remainingMs = Math.max(0, fiveMinutesLater - now);
    const remainingSecs = Math.ceil(remainingMs / 1000);

    console.log("Time calculation:", {
      committedAt: new Date(committedTime).toLocaleString(),
      deadline: new Date(fiveMinutesLater).toLocaleString(),
      now: new Date(now).toLocaleString(),
      remainingMs,
      remainingSecs
    });

    setTimeRemaining(remainingSecs);

    // Set up interval to update the timer
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newValue = Math.max(0, prev - 1);
        return newValue;
      });
    }, 1000);

    return () => {
      console.log("Clearing timer interval");
      clearInterval(interval);
    };
  }, [goal?.id, goal?.status, goal?.committedAt]);

  // Fallback timer initialization - if the main timer useEffect doesn't run
  useEffect(() => {
    // Only if we have a goal and timer hasn't changed from initial 300 seconds
    if (goal?.committedAt && timeRemaining === 300) {
      console.log("Fallback timer initialization triggered");
      const calculatedTime = calculateTimeRemaining(goal.committedAt);

      // Only update if the calculated time is different from default
      if (calculatedTime !== 300) {
        console.log("Setting time from fallback timer:", calculatedTime);
        setTimeRemaining(calculatedTime);
      }

      // Setup the countdown interval
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newValue = Math.max(0, prev - 1);
          return newValue;
        });
      }, 1000);

      return () => {
        console.log("Clearing fallback timer interval");
        clearInterval(interval);
      };
    }
  }, [goal?.committedAt, timeRemaining]);  // Run when committedAt changes or if timeRemaining is still default

  // Handler for when the timer expires
  useEffect(() => {
    if (timeRemaining <= 0 && goal?.id && goal.status === 'draft' && goal.committedAt && !isSubmittingLock) {
      console.log("Timer expired, auto-committing goal:", goal.id);
      setIsSubmittingLock(true);

      // Auto-lock the goal when timer expires
      commitGoal(goal.id, {
        onSuccess: () => {
          console.log("Auto-commit successful, redirecting to committed page");
          router.push('/entry/committed');
        },
        onError: (error) => {
          console.error('Error auto-committing goal:', error);
          setIsSubmittingLock(false);
        }
      });
    }
  }, [timeRemaining, goal?.id, goal?.status, goal?.committedAt, commitGoal, router, isSubmittingLock]);

  // Redirect if not in correct state
  useEffect(() => {
    console.log("Checking goal state for redirects:", {
      isLoading,
      isMutating,
      goalId: goal?.id,
      status: goal?.status,
      hasCommittedAt: !!goal?.committedAt
    });

    if (!isLoading && !isMutating) {
      if (!goal) {
        console.log("No goal found, redirecting to entry page");
        router.push('/entry');
      } else if (goal.status === 'committed') {
        console.log("Goal already committed, redirecting to committed page");
        router.push('/entry/committed');
      } else if (goal.status === 'reflected') {
        console.log("Goal already reflected on, redirecting to entry page");
        router.push('/entry');
      } else if (goal.status === 'draft' && !goal.committedAt) {
        console.log("Goal in initial draft mode, redirecting to entry page");
        router.push('/entry');
      } else {
        console.log("Goal in correct state for refine page:", {
          id: goal.id,
          status: goal.status,
          committedAt: goal.committedAt
        });
      }
    }
  }, [isLoading, isMutating, goal, router]);

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
      await commitGoal(goal.id, {
        onSuccess: () => {
          router.push('/entry/committed');
        },
        onError: (error) => {
          console.error('Error locking goal:', error);
          setIsSubmittingLock(false);
        }
      });
    } catch (err) {
      console.error('Error locking goal:', err);
      setIsSubmittingLock(false);
    }
  };

  // Handle returning to entry for a full edit
  const handleReturnToEntry = async () => {
    if (!goal?.id || isSubmittingLock || isSubmittingEdit || timeRemaining <= 0) return;

    try {
      setIsSubmittingEdit(true);

      // Reset the goal for editing
      await resetEditing(goal.id, {
        onSuccess: () => {
          router.push('/entry');
        },
        onError: (error) => {
          console.error('Error resetting goal for editing:', error);
          setIsSubmittingEdit(false);
        }
      });
    } catch (err) {
      console.error('Error resetting goal for editing:', err);
      setIsSubmittingEdit(false);
    }
  };

  const currentError = error || mutationError;

  // Loading state
  if (isLoading && !goal) {
    return (
      <BlurContainer>
        <div className="flex flex-col justify-center items-center h-full">
          <Loader size={32} className="animate-spin" />
          <p className="mt-4">Loading your goal...</p>
        </div>
      </BlurContainer>
    );
  }

  // Error state
  if (currentError) {
    return (
      <BlurContainer>
        <div className="flex flex-col justify-center items-center h-full">
          <p className="text-red-500 mb-4">{String(currentError)}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </BlurContainer>
    );
  }

  return (
    <>
      <BlurContainer>
        {/* Goal Display (Non-editable) */}
        <div className="flex flex-col justify-start items-start text-left h-full pb-4">
          <h1 className="text-2xl text-text-muted font-light">
            Refine your goal
          </h1>
          <p className="text-xl italic text-text-primary">
            {goal?.text}
          </p>
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
    </>
  );
}