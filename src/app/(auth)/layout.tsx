import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Shell for the signed-out auth pages.
 *
 * Holds the one control every auth page needs but none of them owned before:
 * a theme toggle. The way back to the marketing site lives on the brand panel
 * wordmark, so a visitor is never stranded here.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-muted">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {children}
    </div>
  );
}
