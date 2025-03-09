"use client";

import React, { createContext, useContext, useState } from "react";
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from "@/amplify/data/resource";

interface MainNavContextValue {
  navOpen: boolean;
  toggleNav: () => void;
}

const client = generateClient<Schema>();

Hub.listen('auth', async ({ payload }) => {
  console.log('payload.event', payload.event)
  if (payload.event === 'signedIn') {
    try {
      // Get Cognito user
      const user = await getCurrentUser();
      
      // Check if user exists in your data model
      const { data: existingUsers } = await client.models.User.list({
        filter: {
          cognitoSub: { eq: user.userId }
        }
      });
      console.log('user1', user, existingUsers)
      if (!existingUsers || existingUsers.length === 0) {
        // Create new user if doesn't exist
        await client.models.User.create({
          cognitoSub: user.userId,
          email: user.signInDetails?.loginId || '',
          name: user.username,
          isGuest: false,
        });
      }

    } catch (error) {
      console.error('Error handling sign in:', error);
    }
  }
});


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