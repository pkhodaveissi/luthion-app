import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { getAppUserServer } from "@/lib/utils/amplify-server-utils";
import { getInitialGoalData } from "@/lib/services/goal-service-ssr";
import { runWithAmplifyServerContext } from "@/lib/utils/amplify-server-utils";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec, {});
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  if (!authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Only apply goal state routing to entry pages
  if (request.nextUrl.pathname.startsWith('/entry')) {
    // Get the user
    try {
      const user = await getAppUserServer();
      
      if (user?.id) {
        const currentGoal = await getInitialGoalData(user.id);
        
        if (currentGoal) {
          const currentPath = request.nextUrl.pathname;
          
          // Determine if user needs to be redirected based on goal state
          if (currentGoal.status === 'draft' && currentGoal.committedAt && currentPath === '/entry') {
            // User has a goal in editing mode, redirect to refine
            return NextResponse.redirect(new URL("/entry/refine", request.url));
          } 
          else if (currentGoal.status === 'committed' && currentPath === '/entry') {
            // User has a committed goal, redirect to committed
            return NextResponse.redirect(new URL("/entry/committed", request.url));
          }
          else if (currentGoal.status === 'draft' && !currentGoal.committedAt && 
                  (currentPath === '/entry/refine' || currentPath === '/entry/committed')) {
            // User has a draft goal but is trying to access refine or committed page
            return NextResponse.redirect(new URL("/entry", request.url));
          }
          else if (currentGoal.status === 'committed' && 
                  (currentPath === '/entry/refine')) {
            // User has a committed goal but is trying to access refine page
            return NextResponse.redirect(new URL("/entry/committed", request.url));
          }
        }
      }
    } catch (error) {
      console.error("Error in middleware goal routing:", error);
      // Continue with normal response on error rather than breaking the app
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};