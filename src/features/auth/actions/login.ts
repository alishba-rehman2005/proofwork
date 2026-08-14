"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

const ACCOUNT_NOT_ACTIVE_CODE = "account_not_active";

const NOT_ACTIVE_MESSAGE =
  "Your account is not active yet. Company accounts need admin approval before you can sign in.";

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
        // Auth.js surfaces the subclass's `code`, which lets a pending account
        // get a useful message instead of "invalid email or password".
        const code = (error as AuthError & { code?: string }).code;

        return {
          error:
            code === ACCOUNT_NOT_ACTIVE_CODE ? NOT_ACTIVE_MESSAGE : "Invalid email or password.",
        };
      }

      return { error: "Unable to sign in. Please try again." };
    }

    throw error;
  }
}
