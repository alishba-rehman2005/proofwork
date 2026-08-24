import Link from "next/link";

/*
|--------------------------------------------------------------------------
| SITE FOOTER
|--------------------------------------------------------------------------
| Shared by every signed-out page. Two of the three marketing pages had no
| footer at all, so a visitor reaching the bottom simply ran out of page.
*/

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/for-recruiters", label: "For recruiters" },
      { href: "/leaderboard", label: "Verified talent" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Sign in" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/security", label: "Security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
              </span>
              <span className="text-[15px] font-bold tracking-tight">ProofWork</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Skills verified through practical work and expert review, so hiring runs on evidence
              rather than self-reported claims.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">
                {column.heading}
              </h2>

              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} ProofWork. Part of the CP Nexum ecosystem.
          </p>

          <p className="text-xs text-faint">Built for evidence-based hiring.</p>
        </div>
      </div>
    </footer>
  );
}
