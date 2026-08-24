"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cx } from "@/components/ui";

/*
|--------------------------------------------------------------------------
| SITE HEADER
|--------------------------------------------------------------------------
| One navigation bar for every signed-out page. The marketing pages each
| carried their own copy before, which is how they drifted: only one of the
| three had a theme toggle and none had a mobile menu.
*/

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-recruiters", label: "For recruiters" },
  { href: "/leaderboard", label: "Verified talent" },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The header only needs its scrolled treatment once the page has moved,
  // so this listens rather than re-rendering on every frame.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Background scrolling under an open drawer feels broken on touch.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "border-line bg-surface/85 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-surface/70 backdrop-blur-md",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="ProofWork home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckMark />
          </span>
          <span className="text-[15px] font-bold tracking-tight">ProofWork</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {signedIn ? (
            <Link
              href="/dashboard"
              className="hidden h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover sm:inline-flex"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="hidden h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover hover:shadow-sm sm:inline-flex"
              >
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="site-menu" className="animate-fade border-t border-line bg-surface md:hidden">
          <div className="space-y-1 px-4 py-4 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cx(
                  "block rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary-soft text-primary"
                    : "text-foreground hover:bg-surface-muted",
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="grid gap-2 border-t border-line pt-4">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center justify-center rounded-lg border border-line text-base font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
