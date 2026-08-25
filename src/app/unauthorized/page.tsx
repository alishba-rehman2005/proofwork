import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access denied",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Access denied</h1>

        <p className="mt-3 text-muted">You do not have permission to access this page.</p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-medium shadow-xs transition-colors hover:border-line-strong hover:bg-surface-muted"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
