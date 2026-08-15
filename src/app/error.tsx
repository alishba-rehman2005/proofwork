"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui";

/**
 * Global error boundary.
 *
 * Shows a recoverable message rather than a stack trace: the digest is enough
 * for a developer to find the real error in the server logs without exposing
 * internals to whoever hit the page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="animate-rise max-w-md text-center">
        <p className="text-sm font-medium text-danger">Something went wrong</p>

        <h1 className="mt-2 text-2xl font-semibold">We could not load this page</h1>

        <p className="mt-3 text-muted">
          The error has been logged. You can try again, or head back to your dashboard.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-faint">Reference: {error.digest}</p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            Try again
          </Button>

          <ButtonLink href="/dashboard" variant="secondary">
            Go to dashboard
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
