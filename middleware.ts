import { NextRequest, NextResponse } from "next/server";
import { runWithAmplifyServerContext } from "./utils/auth-middleware-utils";
import { fetchAuthSession } from "aws-amplify/auth/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (ctx) => {
      try {
        const session = await fetchAuthSession(ctx, {})
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false
      }
    }
  })
  if (!authenticated) {
    return NextResponse.redirect(new URL("/signup", request.url))
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|signup).*)"],
};

export const allowedDomains = ['localhost', '192.168.178.115']; // Add your IP

