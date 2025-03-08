import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: "Welcome to Luthion! Verify your email!",
      verificationEmailBody: (code) =>
        `Here is your verification code: ${code()}`,
      verificationEmailStyle: "CODE",
    },
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
});