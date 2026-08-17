import type { Metadata } from "next";

import { ThemeScript } from "@/components/theme/theme-script";

import "./globals.css";

/*
  Typography is a system font stack rather than next/font/google.

  next/font fetches from fonts.gstatic.com at build and dev-compile time, so a
  restricted or offline network stops the app booting at all - every route
  returned 500, then hung. A system stack renders the same families the OS
  already ships (SF on macOS, Segoe on Windows, Roboto on Android), costs no
  network round trip, and eliminates font-swap flash entirely.
*/

export const metadata: Metadata = {
  title: {
    default: "ProofWork",
    template: "%s | ProofWork",
  },
  description:
    "Verified skills for candidates, recruiters, and reviewers. Prove what you can build.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      // The theme script mutates this element before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>

      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
