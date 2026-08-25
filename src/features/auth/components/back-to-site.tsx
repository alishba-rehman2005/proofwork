import Link from "next/link";

/**
 * Escape hatch out of the auth flow.
 *
 * Sits on every signed-out auth page so a visitor who lands here by mistake
 * can always get back to the marketing site in one click.
 */
export function BackToSite({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      Back to Site
    </Link>
  );
}
