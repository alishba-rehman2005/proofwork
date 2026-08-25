import type { ReactNode } from "react";

import { BackToSite } from "@/features/auth/components/back-to-site";

/**
 * Shell for the signed-out auth pages.
 *
 * Theme selection is owned by the landing page and persisted globally. Auth
 * pages consume that saved preference without presenting a second control.
 *
 * The one control they do carry is a way out: a visitor who lands here by
 * mistake can return to the marketing site in a single click.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-muted">
      <div className="pointer-events-none absolute inset-x-0 top-4 z-20 px-4 sm:top-6 lg:px-8">
        <div className="pointer-events-auto mx-auto max-w-[1080px]">
          <BackToSite />
        </div>
      </div>

      {children}
    </div>
  );
}
