// components/Login.tsx
"use client";

import { withAuthenticator } from "@aws-amplify/ui-react";
import { AuthUser, signOut } from "aws-amplify/auth";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function Login({ user }: { user?: AuthUser }) {
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signed_out") === "true";
  useEffect(() => {
    const handleSignOut = async () => {
      await signOut(); // Force user to sign out
      window.location.href = "/login"; // Ensure full reload to clear session
    };
    if (!user || signedOut) {
      handleSignOut();
    } else {
      redirect("/"); // Redirect to home page after successful login
    }
  }, [signedOut, user]);
  return null;
}

export default withAuthenticator(Login);