"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, controlClassName } from "@/components/ui";
import { loginAction, type LoginState } from "@/features/auth/actions/login";
import { ArrowRightIcon } from "@/features/auth/components/auth-icons";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

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
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>

          <Link
            href="/forgot-password"
            className="-mx-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-muted hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          placeholder="••••••••"
          className={`${controlClassName} mt-2 h-12`}
        />
      </div>

      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
        {!pending && <ArrowRightIcon className="h-5 w-5" />}
      </button>
    </form>
  );
}
