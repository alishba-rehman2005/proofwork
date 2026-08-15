import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Reveal } from "@/components/motion/reveal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "ProofWork — prove your skills, don't just claim them",
  description:
    "ProofWork verifies developer and designer skills through practical assessments reviewed by real mentors, so recruiters can hire on evidence rather than self-declared CVs.",
};

const STEPS = [
  {
    number: "01",
    title: "Add a skill",
    body: "List what you can do. Every skill starts unverified — nobody takes your word for it.",
  },
  {
    number: "02",
    title: "Get a real task",
    body: "Request verification and receive a practical brief with requirements, a rubric and a deadline.",
  },
  {
    number: "03",
    title: "Submit your work",
    body: "Send a repository, a live deployment, a Figma file or documentation. Everything is timestamped.",
  },
  {
    number: "04",
    title: "A mentor reviews it",
    body: "A reviewer scores your work against the published rubric. Pass, and the skill becomes verified.",
  },
];

const AUDIENCES = [
  {
    label: "For candidates",
    title: "Evidence beats adjectives",
    points: [
      "Build a profile backed by reviewed work",
      "Get specific feedback from a mentor, not a rejection email",
      "Share one link that proves what you can build",
    ],
    href: "/register",
    cta: "Start proving",
  },
  {
    label: "For companies",
    title: "Shortlist on proof",
    points: [
      "Search by verified skill, score, availability and location",
      "Read the reviewer's assessment before the first call",
      "Skip the take-home: the work is already reviewed",
    ],
    href: "/register",
    cta: "Find candidates",
  },
  {
    label: "For mentors",
    title: "Set the bar",
    points: [
      "Score submissions against a transparent rubric",
      "Approve, request changes, or reject with reasons",
      "Reviewer access is granted by an admin, never self-assigned",
    ],
    href: "/login",
    cta: "Reviewer sign in",
  },
];

const FEATURES = [
  {
    title: "Practical assessments",
    body: "Real briefs with requirements, resources and deadlines.",
  },
  {
    title: "Rubric scoring",
    body: "Weighted criteria, so a score means the same thing every time.",
  },
  { title: "Verified portfolio", body: "Projects reviewed and marked verified, not just linked." },
  {
    title: "Recruiter search",
    body: "Filter by verified skill, score, level, availability, location.",
  },
  {
    title: "Role-based access",
    body: "Candidate, mentor, company and admin, each with its own workspace.",
  },
  {
    title: "Full audit trail",
    body: "Every approval and appointment is recorded and attributable.",
  },
];

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ProofWork
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {session?.user ? (
              <ButtonLink href="/dashboard" size="sm">
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>

                <ButtonLink href="/register" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-rise">
              <Badge tone="outline">Skill verification platform</Badge>

              <h1 className="mt-6 text-4xl leading-[1.05] font-semibold sm:text-6xl">
                Prove your skills.
                <br />
                <span className="text-muted">Don&apos;t just claim them.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg text-muted">
                Anyone can write &ldquo;React.js&rdquo; on a CV. On ProofWork you complete a real
                task, a mentor reviews it against a published rubric, and only then does the skill
                show as verified.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/register">Create your profile</ButtonLink>

                <ButtonLink href="/login" variant="secondary">
                  I already have an account
                </ButtonLink>
              </div>

              <p className="mt-4 text-sm text-muted">
                Free for candidates · Company accounts reviewed before approval
              </p>
            </div>

            {/* A profile fragment, so the promise is visible rather than described. */}
            <div className="animate-rise [animation-delay:120ms]">
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    AK
                  </div>

                  <div>
                    <p className="font-medium">Ayesha Khan</p>
                    <p className="text-sm text-muted">Frontend engineer</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-2">
                  {[
                    { name: "React.js", status: "Verified", score: "92", tone: "solid" as const },
                    { name: "Next.js", status: "Verified", score: "88", tone: "solid" as const },
                    {
                      name: "TypeScript",
                      status: "Under review",
                      score: null,
                      tone: "outline" as const,
                    },
                    { name: "Go", status: "Unverified", score: null, tone: "neutral" as const },
                  ].map((skill) => (
                    <li
                      key={skill.name}
                      className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
                    >
                      <span className="text-sm font-medium">{skill.name}</span>

                      <span className="flex items-center gap-2">
                        {skill.score && (
                          <span className="tabular text-xs text-muted">{skill.score}/100</span>
                        )}

                        <Badge tone={skill.tone}>
                          <span aria-hidden="true">
                            {skill.tone === "solid" ? "✓" : skill.tone === "outline" ? "◕" : "○"}
                          </span>
                          {skill.status}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-xs text-faint">
                  Every verified badge traces back to a reviewed submission.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-surface-raised">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <Reveal>
              <p className="text-2xl leading-snug font-medium sm:text-3xl">
                Hiring runs on trust that nobody has earned yet.
              </p>

              <p className="mt-4 text-muted">
                Candidates write skills they half-know. Companies run take-homes that get thrown
                away. Juniors get rejected for having no proof, and never get the chance to build
                any. ProofWork turns that loop into evidence that follows the candidate.
              </p>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="text-3xl font-semibold">How verification works</h2>

            <p className="mt-3 max-w-2xl text-muted">
              Four steps, and no shortcuts. A reviewer cannot approve work that scores below the
              assessment&apos;s pass mark.
            </p>
          </Reveal>

          <div className="stagger mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.number} className="lift rounded-xl border border-line bg-surface p-6">
                <span className="tabular text-sm font-semibold text-faint">{step.number}</span>

                <h3 className="mt-3 font-medium">{step.title}</h3>

                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Audiences */}
        <section className="border-t border-line bg-surface-raised">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold">Built for three sides of hiring</h2>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {AUDIENCES.map((audience, index) => (
                <Reveal key={audience.label} delay={index * 80}>
                  <div className="lift flex h-full flex-col rounded-xl border border-line bg-surface p-6">
                    <Badge tone="outline">{audience.label}</Badge>

                    <h3 className="mt-4 text-xl font-medium">{audience.title}</h3>

                    <ul className="mt-4 flex-1 space-y-2.5">
                      {audience.points.map((point) => (
                        <li key={point} className="flex gap-2.5 text-sm text-muted">
                          <span aria-hidden="true" className="mt-0.5 text-foreground">
                            ✓
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>

                    <ButtonLink href={audience.href} variant="secondary" className="mt-6 w-full">
                      {audience.cta}
                    </ButtonLink>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="text-3xl font-semibold">What is inside</h2>
          </Reveal>

          <div className="stagger mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="lift rounded-xl border border-line p-6">
                <h3 className="font-medium">{feature.title}</h3>

                <p className="mt-2 text-sm text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Start with one skill you can prove
              </h2>

              <p className="mt-4 text-muted">
                Add it, request verification, and build a profile that says something a CV cannot.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/register">Create your profile</ButtonLink>

                <ButtonLink href="/leaderboard" variant="secondary">
                  See the leaderboard
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="text-sm text-muted">
            ProofWork — skill and work verification for developers and designers.
          </p>

          <div className="flex gap-4 text-sm text-muted">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>

            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
