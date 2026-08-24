import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works | ProofWork",
  description: "See how ProofWork turns practical work into verified professional evidence.",
};

const steps = [
  [
    "01",
    "Choose a skill",
    "Select the capability you want to demonstrate and request verification.",
  ],
  [
    "02",
    "Complete real work",
    "Work through a practical brief with clear requirements, criteria, and a deadline.",
  ],
  [
    "03",
    "Receive expert review",
    "An authorized reviewer evaluates your submission against a transparent rubric.",
  ],
  [
    "04",
    "Publish verified proof",
    "Successful work becomes credible evidence on your professional profile.",
  ],
] as const;

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-.03em]">
            ProofWork
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#000820] px-4 py-2 text-[13px] font-bold text-white"
          >
            Get started →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 py-16 sm:px-6">
        <p className="text-xs font-bold tracking-[.16em] text-[#003bfa]">HOW IT WORKS</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-[-.04em] sm:text-[46px]">
          From claimed skill to credible evidence.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted">
          ProofWork creates a clear, auditable path from practical assessment to professional
          verification.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([number, title, body]) => (
            <article key={number} className="landing-glass-card rounded-xl p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-[#003bfa]">
                {number}
              </span>
              <h2 className="mt-5 text-base font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-[#000820] px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to turn your work into proof?</h2>
          <p className="mt-2 text-sm text-muted">
            Start with one skill and build a profile backed by evidence.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-[#38bdf8] px-5 py-2.5 text-[13px] font-bold text-foreground"
          >
            Create your profile →
          </Link>
        </div>
      </section>
    </main>
  );
}
