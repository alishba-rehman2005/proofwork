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
  name?: string | null;
  children: ReactNode;
};

/**
 * Sidebar layout for every signed-in page.
 *
 * The sidebar and the mobile trigger share open state, so they live in one
 * client component. Everything below it stays a server component.
 */
export function AppShell({
  sections,
  workspaces,
  currentRole,
  email,
  name,
  children,
}: AppShellProps) {
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
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>

            <span className="text-lg font-semibold tracking-tight">ProofWork</span>
          </Link>

          <IconButton label="Close navigation" onClick={() => setOpen(false)} className="lg:hidden">
            <path d="M18 6 6 18M6 6l12 12" />
          </IconButton>
        </div>

        <nav className="space-y-6 p-4" aria-label="Main">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="px-3 text-xs font-semibold tracking-wider text-accent/70 uppercase">
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
                        className={`relative block rounded-lg py-2 ps-4 pe-3 text-sm transition-colors ${
                          active
                            ? "bg-accent-soft font-semibold text-accent"
                            : "text-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-accent"
                          />
                        )}

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

            <Link
              href="/account"
              className="hidden items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted sm:flex"
              title="Account settings"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
              >
                {(name ?? email).slice(0, 1).toUpperCase()}
              </span>

              <span className="text-start leading-tight">
                <span className="block text-sm font-medium">{name ?? "Account"}</span>
                <span className="block text-xs text-muted">{email}</span>
              </span>
            </Link>

            <form action={logoutAction}>
              {/*
                Themed to the accent so it belongs to the shell, but kept as an
                outline rather than a filled button: signing out should not look
                like the primary thing to do on the page.
              */}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:border-accent/60 hover:bg-accent-soft"
              >
                <SignOutIcon />
                <span className="hidden sm:inline">Sign out</span>
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

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

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
