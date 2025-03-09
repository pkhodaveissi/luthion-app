"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Circle } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import BlurContainer from "@/components/BlurContainer";
import MainNavButton from "@/components/MainNavButton";
import MainNavDrawer from "@/components/MainNavDrawer";
import Logout from "@/components/Logout";
import {amplifyClient} from "@/utils/amplify-client-utils"
import { Schema } from "@/amplify/data/resource";

export function useUsers() {
  // Explicitly define the types for your state variables
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: fetchedUsers } = await amplifyClient.models.User.list();
        setUsers(fetchedUsers);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading, error };
}

export default function EntryPage() {
  const { users, isLoading, error } = useUsers();
  console.log('users', users)
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      <GlobalHeader />

      <BlurContainer>
        <EntryPrompt goal="Send an email to my organization, initiating my notice period." />
      </BlurContainer>

      <div className="relative w-full">
        <BlurContainer>
          <EntryActions />
        </BlurContainer>
        <MainNavDrawer />
        <Logout />
      </div>
    </div>
  );
}

// EntryPrompt Component
function EntryPrompt({ goal }: { goal: string }) {
  const [goalText, setGoalText] = useState(goal);
  return (
    <div className="flex flex-col justify-start items-start text-left h-full pb-4">
      <h1 className="text-2xl text-text-muted font-light">
        What will make today meaningful?
      </h1>
      <textarea
        value={goalText}
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
function EntryActions() {
  const router = useRouter();
  
  return (
    <div className="flex w-full justify-between items-center gap-x-4">
      <button
        onClick={() => router.push("/entry/editing")}
        className="btn btn-wide flex items-center justify-center"
      >
        <Circle size={32} className="mr-2" />
        Commit
      </button>
      <MainNavButton />
    </div>
  );
}
