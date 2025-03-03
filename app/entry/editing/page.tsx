"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pen } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";

export default function EditingPage() {
  const router = useRouter();
  const goalText = "Send an email to my organization, initiating my notice period.";

  // Timer State (5 minutes)
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      {/* The rest of your content... */}
      <GlobalHeader />

      <BlurContainer>

      {/* Goal Display (Non-editable) */}
      <div className="flex flex-col justify-start items-start text-left h-full pb-4">
        <p className="text-xl italic text-text-primary">{goalText}</p>
      </div>
      </BlurContainer>

      {/* 
        Use a 'relative' parent so that the drawer can be absolutely 
        positioned in this container (bottom-right). 
      */}
      <div className="relative w-full">
        {/* 
          Wrap ONLY what you want blurred in <BlurContainer>. 
          By leaving MainNavDrawer outside it, the drawer remains clear. 
        */}
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            {/* Edit with Timer */}
            <button
              onClick={() => router.push("/entry")}
              className={`btn btn-wide flex items-center justify-center ${
                timeLeft <= 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={timeLeft <= 0}
            >
              <Pen size={32} className="mr-2" />
              {formatTime(timeLeft)}
            </button>

            {/* Lock Button */}
            <button
              onClick={() => router.push("/entry/committed")}
              className="btn"
            >
              <Lock size={32} />
            </button>

            {/* Nav Button */}
            <MainNavButton />
          </div>
        </BlurContainer>

        {/* 
          Nav Drawer is outside the BlurContainer so it won't get blurred. 
          We absolutely position it in the bottom-right of the same container 
          that has "relative" (the line above). 
        */}
        <MainNavDrawer />
      </div>
    </div>
  );
}