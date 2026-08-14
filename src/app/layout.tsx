import type { Metadata } from "next";

import { ThemeScript } from "@/components/theme/theme-script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
