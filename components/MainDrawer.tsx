"use client";

import { useRef, useEffect } from "react";
import { useMainNav } from "./MainNavContext";
import { User, Info, Tally5, Pencil } from "lucide-react";

export default function MainDrawer() {
  const { navOpen, toggleNav } = useMainNav();
  const menuRef = useRef<HTMLDivElement>(null);

  // (Optional) close menu if user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (navOpen) toggleNav(); // close if open
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navOpen, toggleNav]);

  return (
    <>
      {navOpen && (
        <div
          ref={menuRef}
          className="
            absolute bottom-0 right-0 
            bg-surface 
            grid grid-cols-2
          "
        >
          <button className="btn flex flex-col items-center border-r border-b border-light-gray rounded-none">
            <User size={32} />
          </button>

          <button className="btn flex flex-col items-center border-b border-light-gray rounded-none">
            <Info size={32} />
          </button>

          <button className="btn flex flex-col items-center border-r border-light-gray rounded-none">
            <Tally5 size={32} />
          </button>

          <button className="btn flex flex-col items-center border-light-gray rounded-none">
            <Pencil size={32} />
          </button>
        </div>
      )}
    </>
  );
}