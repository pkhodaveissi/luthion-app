"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Lightbulb, Hourglass, CheckCircle, Crop, X, Circle } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";

export default function ReflectPage() {
  const router = useRouter();
  const goalText = "Send an email to my organization, initiating my notice period.";

  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Reflection options
  const options = [
    { text: "I tried, but life happened.", icon: <RotateCcw size={32} strokeWidth={1} /> },
    { text: "Priorities shifted.", icon: <Lightbulb size={32} strokeWidth={1} /> },
    { text: "Not today, and that’s okay.", icon: <Hourglass size={32} strokeWidth={1} /> },
    { text: "I did it", icon: <CheckCircle size={32} strokeWidth={1} /> },
  ];

  // Handle selection
  const handleSelect = (option: string) => {
    console.log("Selected:", option);
    setShowOptions(false);
    // router.push("/last-7"); // Redirect or handle state update
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

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
      <GlobalHeader />
      {/* Goal Display (Non-editable) */}

      <BlurContainer>

        <div className="flex flex-col justify-start items-start text-left h-full pb-4">
          <p className="text-xl italic text-text-primary">{goalText}</p>
        </div>
      </BlurContainer>

      {/* Action Buttons */}
      <div className="flex w-full flex-col items-center gap-y-2" ref={optionsRef}>
        {/* Reflection Options (Expanding Above the Reflect Button) */}
        {showOptions && (
          <div className="w-full flex flex-col gap-y-2 mb-2 transition-all duration-200">
            {options.map((option, index) => (
              <button
                key={index}
                className="btn flex items-center justify-start w-full"
                onClick={() => handleSelect(option.text)}
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
