"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { logoutAction } from "@/features/auth/actions/logout";
import { isActivePath, type NavSection } from "@/lib/auth/navigation";
import type { Workspace } from "@/lib/auth/workspaces";

type AppShellProps = {
  sections: NavSection[];
  workspaces: Workspace[];
  currentRole: string | null;
  email: string;
  children: ReactNode;
};

/**
 * Sidebar layout for every signed-in page.
 *
 * The sidebar and the mobile trigger share open state, so they live in one
 * client component. Everything below it stays a server component.
 */
export function AppShell({ sections, workspaces, currentRole, email, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-line bg-surface transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            ProofWork
          </Link>

          <IconButton label="Close navigation" onClick={() => setOpen(false)} className="lg:hidden">
            <path d="M18 6 6 18M6 6l12 12" />
          </IconButton>
        </div>

        <nav className="space-y-6 p-4" aria-label="Main">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="px-3 text-xs font-semibold tracking-wider text-faint uppercase">
                {section.heading}
              </p>

              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        // Closed here rather than in an effect on pathname:
                        // the click is what should dismiss the drawer.
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <IconButton
            label="Open navigation"
            onClick={() => setOpen(true)}
            expanded={open}
            className="lg:hidden"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </IconButton>

          <div className="ms-auto flex items-center gap-3">
            <WorkspaceSwitcher workspaces={workspaces} currentRole={currentRole} />

            <ThemeToggle />

            <span className="hidden text-sm text-muted sm:inline">{email}</span>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:bg-surface-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  expanded?: boolean;
  className?: string;
  children: ReactNode;
};

function IconButton({ label, onClick, expanded, className = "", children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
