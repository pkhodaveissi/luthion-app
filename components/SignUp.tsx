"use client";
import { useEffect } from "react"
import { redirect } from  "next/navigation";
import { withAuthenticator } from "@aws-amplify/ui-react"
import { AuthUser } from "aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";

const SingUp = ({user}: {user?: AuthUser}) => {
  useEffect(() => {
    if(user) {
      redirect("/entry")
    }
  })
  return null;
}

export default withAuthenticator(SingUp)