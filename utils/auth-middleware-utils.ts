import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { getCurrentUser } from "aws-amplify/auth/server";
import config from "@/amplify_outputs.json";
import { cookies } from "next/headers";

export const {runWithAmplifyServerContext} = createServerRunner({ config });

export async function GetAuthCurrentUserServer() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: {cookies},
      operation: (ctx) => getCurrentUser(ctx)
    })
    return currentUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}