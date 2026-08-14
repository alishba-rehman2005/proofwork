"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Invalid email or password.",
        };
      }

      return {
        error: "Unable to sign in. Please try again.",
      };
    }

    throw error;
  }
}
