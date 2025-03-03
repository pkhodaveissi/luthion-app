"use client";

import React, { createContext, useContext, useState } from "react";

interface MainNavContextValue {
  navOpen: boolean;
  toggleNav: () => void;
}

// Create the context
const MainNavContext = createContext<MainNavContextValue | undefined>(
  undefined
);

// Export a handy hook
export function useMainNav() {
  const context = useContext(MainNavContext);
  if (!context) {
    throw new Error("useMainNav must be used within a MainNavProvider");
  }
  return context;
}

// The provider component
export function MainNavProvider({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = () => setNavOpen((prev) => !prev);

  return (
    <MainNavContext.Provider value={{ navOpen, toggleNav }}>
      {children}
    </MainNavContext.Provider>
  );
}