"use client";

import { createContext, useState, useEffect, useRef, useContext, ReactNode } from "react";
import { User, Info, Tally5, Pencil, List, X } from "lucide-react";

// Context to manage nav state globally
const NavContext = createContext({ showMenu: false, toggleMenu: () => {} });

export function BlurContainer({ children }: { children: ReactNode }) {
  const { showMenu } = useContext(NavContext);
  console.log("showMenu", showMenu)
  return (
    <div className={`relative transition-all ${showMenu ? "bg-black/40  backdrop-blur-md" : ""}`}>
      {children}
    </div>
  );
}

export default function MainNav() {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <NavContext.Provider value={{ showMenu, toggleMenu: () => setShowMenu((prev) => !prev) }}>
      {/* Blurring Effect */}

      {/* Floating Nav Button (Right Side of Main Action Button) */}
      <div className="bottom-6 right-6 flex items-center gap-x-4">
        <button onClick={() => setShowMenu((prev) => !prev)} className="btn">
          {showMenu ? <X size={32} /> : <List size={32} />}
        </button>
      </div>

      {/* Nav Menu */}
      {showMenu && (
        <div ref={menuRef} className="absolute bottom-0 right-0 bg-surface grid grid-cols-2">
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
    </NavContext.Provider>
  );
}
