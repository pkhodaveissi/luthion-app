"use client";

import { useRef, useEffect } from "react";
import { useMainNav } from "./MainNavContext";
import { CircleUser, Info, Pen, Tally5, X } from "lucide-react";

export default function MainNavDrawer() {
  const { navOpen, toggleNav } = useMainNav();
  const menuRef = useRef<HTMLDivElement>(null);

  // OPTIONAL: close menu if user clicks outside it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (navOpen) toggleNav();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navOpen, toggleNav]);

  if (!navOpen) return null;

  return (
    <div
      ref={menuRef}
      className="
        bg-background
        absolute
        bottom-0 
        right-0 
        grid grid-cols-2
      "
    >
      <button className="btn flex flex-col items-center border-r border-b border-background  rounded-none text-text-muted">
        <CircleUser size={32} strokeWidth={1} />
      </button>
      <button className="btn flex flex-col items-center border-b border-background  rounded-none text-text-muted" >
        <Info size={32} strokeWidth={1} />
      </button>
      <button className="btn flex flex-col items-center border-r border-b border-background  rounded-none text-text-muted" >
        <Tally5 size={32} strokeWidth={1} />
      </button>
      <button className="btn flex flex-col items-center border-b border-background  rounded-none">
        <Pen size={32} strokeWidth={1} />
      </button>
      <button className="btn flex flex-col items-center border-r border-background  rounded-none text-text-muted" >
        <Tally5 size={32} strokeWidth={1} />
      </button>
      <button onClick={toggleNav} className="btn flex flex-col items-center border-background  rounded-none">
        <X size={32} />
      </button>
    </div>
  );
}