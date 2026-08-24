import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "For recruiters | ProofWork",
  description: "Discover and shortlist candidates using reviewed, verified evidence.",
};

const benefits = [
  ["Search verified ability", "Filter talent by proven skill, score, availability, and location."],
  [
    "Review evidence first",
    "Inspect assessed work and transparent outcomes before scheduling a call.",
  ],
  [
    "Compare consistently",
    "Use structured scoring instead of relying only on keywords and claims.",
  ],
  [
    "Hire with confidence",
    "Follow an attributable trail of submissions, reviews, and verification decisions.",
  ],
] as const;

export default async function ForRecruitersPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader signedIn={Boolean(session?.user)} />

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-xs font-bold tracking-[.16em] text-primary">FOR RECRUITERS</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-.04em] sm:text-[46px]">
          Shortlist candidates using proof, not keywords.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted">
          Find professionals whose skills are supported by completed work, expert review, and
          transparent scoring.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {benefits.map(([title, body], index) => (
            <article key={title} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-surface-muted px-6 py-8">
          <div>
            <h2 className="text-xl font-bold">Discover evidence-backed talent</h2>
            <p className="mt-1 text-sm text-muted">
              Explore verified profiles or create your recruiter account.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/leaderboard"
              className="rounded-lg border border-line-strong px-4 py-2.5 text-[13px] font-semibold"
            >
              Browse talent
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground"
            >
              Get started →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
