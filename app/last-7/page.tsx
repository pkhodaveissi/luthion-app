"use client";

import { JSX, useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  RotateCcw,
  Lightbulb,
  Hourglass,
  Pen,
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import MainNavButton from "@/components/MainNavButton";
import BlurContainer from "@/components/BlurContainer";
import MainNavDrawer from "@/components/MainNavDrawer";
import { useRouter } from "next/navigation";

// Define types
interface Entry {
  text: string;
  icon: "check" | "rotate" | "lightbulb" | "hourglass";
}

// Example API response
const fetchEntries = async (): Promise<Entry[]> => {
  return [
    { text: "Send an email to my organization, initiating my notice period.", icon: "check" },
    { text: "Revamp your CV!", icon: "hourglass" },
    { text: "Hit the Gym!", icon: "check" },
    { text: "Call Joe!", icon: "lightbulb" },
    { text: "Grab your jacket from the dry-cleaner place!", icon: "check" },
    { text: "Return the bicycle!", icon: "rotate" },
    { text: "Call Mom!", icon: "check" },
  ];
};

const iconMap: Record<Entry["icon"], JSX.Element> = {
  check: <CheckCircle size={32} strokeWidth={1} />, // Completed
  rotate: <RotateCcw size={32} strokeWidth={1} />, // Retry
  lightbulb: <Lightbulb size={32} strokeWidth={1} />, // Idea
  hourglass: <Hourglass size={32} strokeWidth={1} />, // Delayed
};

const reflectionOptions = [
  { text: "I tried, but life happened.", icon: <RotateCcw size={32} strokeWidth={1} /> },
  { text: "Priorities shifted.", icon: <Lightbulb size={32} strokeWidth={1} /> },
  { text: "Not today, and that’s okay.", icon: <Hourglass size={32} strokeWidth={1} /> },
  { text: "I did it", icon: <CheckCircle size={32} strokeWidth={1} /> },
];

export default function Last7Page() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const router = useRouter();
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadEntries() {
      const data = await fetchEntries();
      setEntries(data.reverse()); // Reverse to show latest at the bottom
    }
    loadEntries();
  }, []);

  // Close options when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setSelectedEntry(null);
      }
    }

    if (selectedEntry !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEntry]);

  // Handle selection of an entry
  const handleEntryClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const entryElement = event.currentTarget;
    const rect = entryElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenAbove = spaceBelow < 317; // Open above if not enough space below
    setSelectedEntry(shouldOpenAbove ? -index-1 : index+1); // Store negative index for above
  };

  // Handle selection of a reflection option
  const handleReflectionSelect = (option: string) => {
    console.log("Selected reflection:", option);
    setSelectedEntry(null);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      <GlobalHeader />

      <BlurContainer>
        {/* List container */}
        <div className="flex flex-col grow gap-3 pb-4 justify-end relative">
          {entries.map((entry, index) => {
            const isSelected = Math.abs(selectedEntry!) === index + 1;
            const openAbove = selectedEntry! < 0;
            return (
              <div
                key={index}
                className={`relative flex flex-col w-full p-4 border border-border/30 rounded-sm transition-all duration-200 cursor-pointer
                  ${selectedEntry !== null && !isSelected ? "blur-sm opacity-0 pointer-events-none" : ""}
                `}
                onClick={(event) => handleEntryClick(index, event)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg italic flex-1">{entry.text}</p>
                  {iconMap[entry.icon]}
                </div>

                {/* Show reflection options when an item is selected */}
                {isSelected && (
                  <div
                    className={`absolute left-0 w-full flex flex-col gap-y-2 mt-2 bg-background p-3 rounded-sm shadow-lg transition-all duration-200 
                      ${openAbove ? "bottom-full mb-2" : "top-full mt-2"}
                    `}
                    ref={optionsRef}
                  >
                    {reflectionOptions.map((option, idx) => (
                      <button
                        key={idx}
                        className="btn flex items-center justify-start w-full"
                        onClick={() => handleReflectionSelect(option.text)}
                      >
                        {option.icon}
                        <span className="ml-2">{option.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-text-muted text-center text-sm pb-2 opacity-80">--- Latest ---</div>
        </div>
      </BlurContainer>

      {/* Navigation and Action Buttons */}
      <div className="relative w-full">
        <BlurContainer>
          <div className="flex w-full justify-between items-center gap-x-4">
            <button
              onClick={() => router.push("/entry")}
              className="btn btn-wide flex items-center justify-center"
            >
              <Pen size={32} className="mr-2" />
              What Matters Now?
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
