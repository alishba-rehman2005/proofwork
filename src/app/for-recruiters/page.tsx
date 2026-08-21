import type { Metadata } from "next";
import Link from "next/link";

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

export default function ForRecruitersPage() {
  return (
    <main className="min-h-screen bg-[#000820] text-white">
      <header className="border-b border-white/10 bg-[#000820]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-.03em]">
            ProofWork
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#38bdf8] px-4 py-2 text-[13px] font-bold text-[#000820]"
          >
            Recruiter account →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 py-16 sm:px-6">
        <p className="text-xs font-bold tracking-[.16em] text-[#38bdf8]">FOR RECRUITERS</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-.04em] sm:text-[46px]">
          Shortlist candidates using proof, not keywords.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#adbbce]">
          Find professionals whose skills are supported by completed work, expert review, and
          transparent scoring.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {benefits.map(([title, body], index) => (
            <article key={title} className="landing-glass-dark rounded-xl p-5">
              <span className="font-mono text-xs font-bold text-[#38bdf8]">0{index + 1}</span>
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#adbbce]">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[.04] px-6 py-8">
          <div>
            <h2 className="text-xl font-bold">Discover evidence-backed talent</h2>
            <p className="mt-1 text-sm text-[#adbbce]">
              Explore verified profiles or create your recruiter account.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/leaderboard"
              className="rounded-lg border border-white/20 px-4 py-2.5 text-[13px] font-semibold"
            >
              Browse talent
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#38bdf8] px-4 py-2.5 text-[13px] font-bold text-[#000820]"
            >
              Get started →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
