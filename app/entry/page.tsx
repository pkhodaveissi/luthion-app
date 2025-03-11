"use client";

import { useState, useEffect, FormEvent, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Circle } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import BlurContainer from "@/components/BlurContainer";
import MainNavButton from "@/components/MainNavButton";
import MainNavDrawer from "@/components/MainNavDrawer";
import Logout from "@/components/Logout";
import { useGoal } from "@/lib/hooks/useGoal";

export default function EntryPage() {
  const router = useRouter();
  const {
    goal,
    loading,
    error,
    hasActiveGoal,
    createGoal,
    updateGoalText,
    refreshGoal
  } = useGoal();

  const [goalText, setGoalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // KEEP AS IS: The original effect is correct
  // Initialize form with current goal text if available
  useEffect(() => {
    if (goal?.text && goal.status === 'draft' && !goal.committedAt) {
      setGoalText(goal.text);
    }
  }, [goal]);

  // Handle goal submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim() || isSubmitting) return; // Added isSubmitting check
    
    try {
      setIsSubmitting(true);
      
      // If there's an existing goal in draft state, update it
      // Otherwise create a new one
      if (hasActiveGoal && goal?.status === 'draft' && !goal.committedAt) {
        console.log('fuck goal text update')
        await updateGoalText(goalText);
      } else {
        console.log('fuck goal create')
        
        await createGoal(goalText);

      }
      
      // Navigate to the refine page
    } catch (err) {
      console.error('Error submitting goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRITICAL PROBLEM - DO NOT MODIFY: Keep the original navigation logic
  // Redirect if there's already a goal in progress
  useEffect(() => {
    if (!loading && hasActiveGoal) {
      if (goal?.status === 'draft' && goal.committedAt) {
        // Goal is in editing mode
        router.push('/entry/refine');
      } else if (goal?.status === 'committed') {
        // Goal is committed and ready for reflection
        router.push('/entry/committed');
      }
    }
  }, [loading, hasActiveGoal, goal, router]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={refreshGoal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      <GlobalHeader />

      <BlurContainer>
        <EntryPrompt goalText={goalText} setGoalText={setGoalText} />
      </BlurContainer>

      <div className="relative w-full">
        <BlurContainer>
          <EntryActions 
            commit={handleSubmit} 
            commitButtonDisabled={isSubmitting || !goalText.trim()} 
            isSubmitting={isSubmitting} 
          />
        </BlurContainer>
        <MainNavDrawer />
        <Logout />
      </div>
    </div>
  );
}

// EntryPrompt Component
function EntryPrompt({ goalText, setGoalText }: { goalText: string, setGoalText: Dispatch<SetStateAction<string>> }) {
  return (
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
  );
}

// EntryActions Component
function EntryActions({ 
  commit, 
  commitButtonDisabled, 
  isSubmitting 
}: { 
  commit: (e: FormEvent<Element>) => Promise<void>, 
  commitButtonDisabled: boolean, 
  isSubmitting: boolean 
}) {
  return (
    <div className="flex w-full justify-between items-center gap-x-4">
      <button
        onClick={commit}
        disabled={commitButtonDisabled}
        className="btn btn-wide flex items-center justify-center"
      >
        <Circle size={32} className="mr-2" />
        {isSubmitting ? 'Committing...' : 'Commit'}
      </button>
      <MainNavButton />
    </div>
  );
}