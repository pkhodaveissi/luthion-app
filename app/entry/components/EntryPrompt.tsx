// app/entry/components/EntryPrompt.tsx
"use client"
import { useState } from "react";
interface EntryPromptProps {
  goal: string;
}

export default function EntryPrompt({ goal }: EntryPromptProps) {
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
        className="text-xl italic text-text-primary bg-transparent border-none outline-none resize-none text-left w-full max-w-md h-full"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevents new line
            e.currentTarget.blur(); // Closes keyboard
          }
        }}
      />
    </div>
  );
}
