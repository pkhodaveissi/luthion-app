import { cookies } from "next/headers";

import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getCurrentUser } from "aws-amplify/auth/server";

import { type Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";

type User = Schema['User']['type'];

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

export const amplifyCookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

export async function AuthGetCurrentUserServer() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return currentUser;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Get the application user details from the database using Cognito ID
 */
export async function getAppUserServer(): Promise<User | null> {
  try {
    // First, get the Cognito user to get the sub/userId
    const cognitoUser = await AuthGetCurrentUserServer();
    
    if (!cognitoUser?.userId) {
      return null;
    }
    
    // Then query for the app user with matching cognitoSub
    const { data: users } = await amplifyCookiesClient.models.User.list({
      filter: {
        cognitoSub: { eq: cognitoUser.userId }
      }
    });
    
    // Return the first matching user or null
    return users && users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Failed to get application user:', error);
    return null;
  }
}

/**
 * Get user by ID directly (use when you already have the user ID)
 */
export async function getUserByIdServer(userId: string): Promise<User | null> {
  try {
    const { data: user } = await amplifyCookiesClient.models.User.get({ id: userId });
    return user;
  } catch (error) {
    console.error(`Failed to get user by ID ${userId}:`, error);
    return null;
  }
}

/**
 * Create a new session context that includes user data
 * This is useful for passing to server components
 */
export async function getAuthSessionContext() {
  const cognitoUser = await AuthGetCurrentUserServer();
  const appUser = await getAppUserServer();
  
  return {
    authenticated: !!cognitoUser,
    cognitoUserId: cognitoUser?.userId || null,
    user: appUser,
    isLoading: false,
  };
}

/**
 * Higher-order function to protect server routes
 * Use this to wrap your server component rendering functions
 */
// export function withAuth<T>(
//   handler: (user: User, params: T) => Promise<any>,
//   fallback: () => Promise<any> = () => Promise.resolve(null)
// ) {
//   return async (params: T) => {
//     const user = await getAppUserServer();
    
//     if (!user) {
//       return fallback();
//     }
    
//     return handler(user, params);
//   };
// }