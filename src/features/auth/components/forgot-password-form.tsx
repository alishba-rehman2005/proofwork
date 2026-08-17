"use client";

import { useActionState } from "react";

import { Alert, controlClassName } from "@/components/ui";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/features/auth/actions/forgot-password";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.submitted) {
    return (
      <Alert tone="success" title="Request received">
        If that email belongs to an account, an administrator will be in touch to complete the
        reset.
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Work email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="name@company.com"
          className={`${controlClassName} mt-2 h-12`}
        />

        {state.error && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : "Request password reset"}
      </button>
    </form>
  );
}
