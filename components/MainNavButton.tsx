"use client";

import { useMainNav } from "@/components/MainNavContext";
import { Circle } from "lucide-react";

export default function MainNavButton() {
  const { navOpen, toggleNav } = useMainNav();

  return (
    <button className="btn" onClick={toggleNav}>
      {/* Could change icon or style if nav is open */}
      <Circle size={32} className={navOpen ? "rotate-45 transition" : ""} />
    </button>
  );
}