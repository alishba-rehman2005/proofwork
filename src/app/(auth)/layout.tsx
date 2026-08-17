import type { ReactNode } from "react";

/**
 * Shell for the signed-out auth pages.
 *
 * Theme selection is owned by the landing page and persisted globally. Auth
 * pages consume that saved preference without presenting a second control.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="relative min-h-screen bg-surface-muted">{children}</div>;
}
