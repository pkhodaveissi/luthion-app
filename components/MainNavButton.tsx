"use client";

import { usePathname } from "next/navigation";
import { useMainNav } from "@/components/MainNavContext";
import { LucideIcon, Pen, Circle, CircleDot, Tally5, List, CircleUser, Info } from "lucide-react";

// Define a mapping of routes to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  "/entry": Pen,
  "/entry/refine": Circle,
  "/entry/committed": CircleDot,
  "/last-7": List,
  "/rank": Tally5,
};

export default function MainNavButton() {
  const { navOpen, toggleNav } = useMainNav();
  const pathname = usePathname();

  // Handle dynamic user pages and info pages
  const isUserPage = /^\/user-\d+$/.test(pathname);
  const isInfoPage = pathname.endsWith("/info");

  let IconComponent: LucideIcon = Circle; // Default icon

  if (iconMap[pathname]) {
    IconComponent = iconMap[pathname];
  } else if (isUserPage) {
    IconComponent = CircleUser;
  } else if (isInfoPage) {
    IconComponent = Info;
  }

  return (
    <button className="btn" onClick={toggleNav}>
      <IconComponent size={32} className={`transition duration-150 ${navOpen ? "rotate-[20deg]" : "rotate-0"}`} />
    </button>
  );
}