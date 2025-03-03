"use client";

import { ReactNode } from "react";
import { useMainNav } from "@/components//MainNavContext";

interface BlurContainerProps {
  children: ReactNode;
}

export default function BlurContainer({ children }: BlurContainerProps) {
  const { navOpen } = useMainNav();

  // If nav is open, apply a backdrop blur on the content
  // (You can tweak the Tailwind classes for the level of blur/brightness you want.)
  return (
    <div
      className={
        navOpen
          ? "h-full w-full transition ease-in-out duration-200 filter blur-sm"
          : "transition ease-in-out duration-200"
      }
    >
      {children}
    </div>
  );
}