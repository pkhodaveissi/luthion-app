import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Use 'next/router' for Pages Router
import { usePathname } from 'next/navigation'; // For App Router

type RouterEvents = {
  on(event: string, callback: (url: string) => void): void;
  off(event: string, callback: (url: string) => void): void;
};

interface NextRouter {
  events?: RouterEvents;
}

export function usePreviousRoute(): string{
  const router = useRouter() as NextRouter;
  const pathname = usePathname();
  const [previousRoute, setPreviousRoute] = useState<string>('/entry');

  useEffect(() => {
    // Get current pathname when component mounts
    const currentPath = pathname || window.location.pathname;


    // For App Router (Next.js 13+)
    // Retrieve the stored previous path
    const storedPrevPath = sessionStorage.getItem('prevPath');
    if (storedPrevPath && storedPrevPath !== currentPath) {
      setPreviousRoute(storedPrevPath);
    }

    // Save current path for future reference
    sessionStorage.setItem('prevPath', currentPath);
  }, [router, pathname]);
// Normalize routes starting with '/entry' to just '/entry'
  if (previousRoute && previousRoute.startsWith('/entry')) {
    return '/entry';
  }
  return previousRoute;
}