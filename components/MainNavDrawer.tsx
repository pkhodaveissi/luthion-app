import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { useMainNav } from "./MainNavContext";
import { LucideIcon, Pen, Tally5, List, CircleUser, X } from "lucide-react";
import { usePreviousRoute } from "@/lib/hooks/usePreviousRoute";




// {routeList.map((option) => (
//   <button
//     key={option.id}
//     className="btn flex items-center justify-start w-full"
//     onClick={undefined}
//   >
//     {option.icon}
//   </button>
// ))}
const routeMap: Record<string, LucideIcon> = {
  '/last-7': List,
  '/rank': Tally5,
  '/entry': Pen,
  '/user': CircleUser,
};
export default function MainNavDrawer() {
  const router = useRouter();
  const { navOpen, toggleNav } = useMainNav();
  const menuRef = useRef<HTMLDivElement>(null);
  const prevRoute = usePreviousRoute();
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
  console.log('fuck: prevRoute', prevRoute)
  const menuItems = [
    { icon: CircleUser, muted: true, stroke: 1 },
    { icon: Tally5, muted: true, stroke: 1, onClick: () => router.push("/rank") },
    { icon: List, muted: true, stroke: 1, onClick: () =>  router.push("/last-7") },
    { icon: Pen, muted: true, stroke: 1, onClick: () => router.push("/entry") },
    { icon: routeMap[prevRoute], muted: true, stroke: 1, onClick: () => router.push(prevRoute) },
    { icon: X, muted: false, stroke: 2, onClick: toggleNav }
  ];

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
      {menuItems.map((item, index) => {
        // Determine border classes based on index
        const borderClasses = [
          // Add right border to left column (even indices are 0, 2, 4)
          index % 2 === 0 ? "border-r" : "",
          // Add bottom border to all except last row
          index < menuItems.length - 2 ? "border-b" : "",
          "border-background rounded-none"
        ].join(" ");

        return (
          <button
            key={index}
            className={`btn flex flex-col items-center ${borderClasses} ${item.muted ? "text-text-muted" : ""}`}
            onClick={item.onClick ? item.onClick : undefined}
          >
            <item.icon size={32} strokeWidth={item.stroke} />
          </button>
        );
      })}
    </div>
  );
}