import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

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

export default async function HowItWorksPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader signedIn={Boolean(session?.user)} />

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-xs font-bold tracking-[.16em] text-primary">HOW IT WORKS</p>
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
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-primary">
                {number}
              </span>
              <h2 className="mt-5 text-base font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>

        <div className="landing-cta-card mt-12 overflow-hidden rounded-2xl px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to turn your work into proof?</h2>
          <p className="mt-2 text-base leading-7 text-[#c3cee4]">
            Start with one skill and build a profile backed by evidence.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
          >
            Create your profile →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
