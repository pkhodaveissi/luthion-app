// /app/entry/EntryPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Circle, Loader } from "lucide-react";
import BlurContainer from "@/components/BlurContainer";
import MainNavButton from "@/components/MainNavButton";
import MainNavDrawer from "@/components/MainNavDrawer";
import { useCurrentGoal, useGoalMutations } from "@/lib/hooks/useGoalQuery";
import { type Schema } from '@/amplify/data/resource';

type Goal = Schema['Goal']['type'];

export default function EntryPageClient({ initialGoal, userId }: { initialGoal: Goal | null, userId: string }) {
  const router = useRouter();

  // const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the TanStack Query hooks with SSR initial data
  const { data: goal, isLoading, error } = useCurrentGoal(userId, initialGoal);

  const {
    createGoal,
    updateGoalText,
    isLoading: isMutating,
    error: mutationError
  } = useGoalMutations(userId);
  const [goalText, setGoalText] = useState(initialGoal?.text || '');

  // Initialize form with current goal text if available
  useEffect(() => {
    if (goal?.text && goal.status === 'draft' && !goal.committedAt) {
      setGoalText(goal.text);
    }
  }, [goal]);

  // Handle goal submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Start time tracking
    const timings = {
      start: Date.now(),
      beforeMutation: 0,
      afterMutation: 0,
      onSuccessStart: 0,
      onSuccessEnd: 0
    };

    console.log(`[${new Date().toISOString()}] Submit started`);

    if (!goalText.trim() || isMutating) {
      console.log(`[${new Date().toISOString()}] Submit aborted - empty text or already mutating`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Goal state:`, {
      goalId: goal?.id,
      status: goal?.status,
      hasCommittedAt: !!goal?.committedAt,
      text: goalText.substring(0, 20) + (goalText.length > 20 ? '...' : '')
    });

    try {
      if (goal?.status === 'draft' && !goal.committedAt) {
        if (!goal.id) {
          console.log(`[${new Date().toISOString()}] Missing goal ID`);
          throw new Error('Goal ID is missing');
        }

        console.log(`[${new Date().toISOString()}] Starting updateGoalText`);
        timings.beforeMutation = Date.now();

        await updateGoalText(
          { id: goal.id, text: goalText },
          {
            onSuccess: () => {
              timings.onSuccessStart = Date.now();
              console.log(`[${new Date().toISOString()}] updateGoalText success callback started`);
              console.log(`Time to success callback: ${timings.onSuccessStart - timings.start}ms`);

              // Navigate after successful update
              console.log(`[${new Date().toISOString()}] Navigating to /entry/refine`);
              router.push('/entry/refine');

              timings.onSuccessEnd = Date.now();
              console.log(`[${new Date().toISOString()}] Success callback completed`);
              console.log(`Success callback duration: ${timings.onSuccessEnd - timings.onSuccessStart}ms`);
              console.log(`Total operation time: ${timings.onSuccessEnd - timings.start}ms`);
            },
            onError: (error) => {
              console.error(`[${new Date().toISOString()}] Error updating goal:`, error);
            }
          }
        );

        timings.afterMutation = Date.now();
        console.log(`[${new Date().toISOString()}] updateGoalText completed`);
        console.log(`Mutation duration: ${timings.afterMutation - timings.beforeMutation}ms`);

      } else {
        console.log(`[${new Date().toISOString()}] Starting createGoal`);
        timings.beforeMutation = Date.now();

        await createGoal(
          goalText,
          {
            onSuccess: () => {
              timings.onSuccessStart = Date.now();
              console.log(`[${new Date().toISOString()}] createGoal success callback started`);
              console.log(`Time to success callback: ${timings.onSuccessStart - timings.start}ms`);

              // Navigate after successful creation
              console.log(`[${new Date().toISOString()}] Navigating to /entry/refine`);
              router.push('/entry/refine');

              timings.onSuccessEnd = Date.now();
              console.log(`[${new Date().toISOString()}] Success callback completed`);
              console.log(`Success callback duration: ${timings.onSuccessEnd - timings.onSuccessStart}ms`);
              console.log(`Total operation time: ${timings.onSuccessEnd - timings.start}ms`);
            },
            onError: (error) => {
              console.error(`[${new Date().toISOString()}] Error creating goal:`, error);
            }
          }
        );

        timings.afterMutation = Date.now();
        console.log(`[${new Date().toISOString()}] createGoal completed`);
        console.log(`Mutation duration: ${timings.afterMutation - timings.beforeMutation}ms`);
      }

    } catch (err) {
      const endTime = Date.now();
      console.error(`[${new Date().toISOString()}] Error in goal submission:`, err);
      console.log(`Error occurred after ${endTime - timings.start}ms`);
    }

    // Log final timing summary
    console.log('Timing summary:', {
      totalDuration: Date.now() - timings.start,
      beforeMutationTime: timings.beforeMutation - timings.start,
      mutationDuration: timings.afterMutation > 0 ? timings.afterMutation - timings.beforeMutation : 'incomplete',
      callbackDelay: timings.onSuccessStart > 0 ? timings.onSuccessStart - timings.afterMutation : 'never called'
    });
  };

  // Redirect if there's already a goal in progress
  useEffect(() => {
    if (!isLoading && goal) {
      if (goal.status === 'draft' && goal.committedAt) {
        // Goal is in editing mode
        router.push('/entry/refine');
      } else if (goal.status === 'committed') {
        // Goal is committed and ready for reflection
        router.push('/entry/committed');
      }
    }
  }, [isLoading, goal, router]);

  const currentError = error || mutationError;

  if (currentError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{String(currentError)}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <BlurContainer>
        <div className="flex flex-col justify-start items-start text-left h-full pb-4">
          <h1 className="text-2xl text-text-muted font-light">
            What will make today meaningful?
          </h1>
          <textarea
            value={goalText}
            placeholder="Tap here to type your goal..."
            enterKeyHint="done"
            onChange={(e) => setGoalText(e.target.value)}
            className="text-xl italic text-text-primary bg-transparent border-none outline-none resize-none text-left w-full h-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        </div>
      </BlurContainer>

      <div className="relative w-full">
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            <button
              onClick={handleSubmit}
              disabled={isMutating || !goalText.trim() || isLoading}
              className="btn btn-wide flex items-center justify-center"
            >
              {isMutating ? (
                <Loader size={32} className="mr-2 animate-spin" />
              ) : (
                <Circle size={32} className="mr-2" />
              )}
              {isMutating ? 'Committing...' : 'Commit'}
            </button>
            <MainNavButton />
          </div>
        </BlurContainer>
        <MainNavDrawer />
      </div>
    </>
  );
}