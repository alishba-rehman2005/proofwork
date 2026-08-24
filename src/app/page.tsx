import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "ProofWork — skills backed by evidence",
  description:
    "Complete practical assessments, receive expert reviews, and build a professional profile backed by verified evidence.",
};

const steps = [
  ["01", "Choose a skill", "Add the capability you want to prove and request verification."],
  [
    "02",
    "Complete real work",
    "Receive a practical brief with requirements, a rubric, and a deadline.",
  ],
  [
    "03",
    "Get expert review",
    "A qualified reviewer scores your submission against transparent criteria.",
  ],
  [
    "04",
    "Earn verification",
    "Pass the assessment and publish credible proof on your professional profile.",
  ],
] as const;

const features = [
  [
    "Practical assessments",
    "Real briefs designed to measure applied skill, not memorized answers.",
  ],
  [
    "Transparent scoring",
    "Published rubrics and weighted criteria make every result understandable.",
  ],
  [
    "Evidence-backed profiles",
    "Every verified badge traces to reviewed work and a recorded outcome.",
  ],
  [
    "Verified talent search",
    "Filter candidates by proven skill, score, availability, and location.",
  ],
  [
    "Expert review network",
    "Authorized reviewers evaluate submissions within their proven expertise.",
  ],
  ["Complete audit trail", "Appointments, submissions, scores, and decisions remain attributable."],
] as const;

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader signedIn={Boolean(session?.user)} />

      <main>
        <section className="relative flex items-center overflow-hidden bg-[#000820] text-white lg:min-h-[calc(100svh-60px)]">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(140,166,199,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(140,166,199,.06)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -top-40 right-[-8%] h-[600px] w-[600px] rounded-full bg-[#003bfa]/10 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-8 px-4 py-9 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="animate-rise max-w-[650px]">
              <h1 className="text-[32px] leading-[1.08] font-bold tracking-[-0.045em] sm:text-[50px]">
                Your skills deserve
                <br className="hidden sm:block" />{" "}
                <span className="text-[#38bdf8]">credible proof.</span>
              </h1>
              <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#b7c4d7] sm:mt-5 sm:text-[15px] sm:leading-7">
                Complete real assessments, receive structured expert reviews, and build a
                professional profile backed by evidence—not self-reported claims.
              </p>
              <div className="mt-6 grid gap-2.5 sm:mt-7 sm:flex sm:flex-wrap">
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#38bdf8] px-5 text-[13px] font-bold text-foreground shadow-[0_10px_28px_rgba(56,189,248,.18)] transition hover:-translate-y-0.5 hover:bg-[#7dd3fc] hover:shadow-[0_14px_32px_rgba(56,189,248,.26)]"
                >
                  Create your profile <Arrow />
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[.045] px-5 text-[13px] font-semibold text-[#e8eef6] transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[.09]"
                >
                  <Search />
                  Explore verified talent
                </Link>
              </div>
              <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 text-xs text-muted sm:flex sm:flex-wrap">
                <Trust>Free candidate profiles</Trust>
                <Trust>Transparent scoring</Trust>
                <Trust>Human-reviewed work</Trust>
              </div>
            </div>
            <div className="animate-rise [animation-delay:120ms]">
              <HeroIllustration />
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,.09),transparent_35%)] px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-[1120px]">
            <Reveal className="lg:order-2">
              <Heading
                eyebrow="THE VERIFICATION PROCESS"
                title="From claimed skill to credible evidence"
                body="A structured four-step workflow turns your work into a professional signal that recruiters can trust."
              />
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map(([number, title, body], index) => (
                <Reveal key={number} delay={index * 70}>
                  <article className="landing-glass-card h-full rounded-xl p-5">
                    <div className="flex items-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#bfd4ff] bg-primary-soft text-[#003bfa]">
                        <ProcessIcon step={index} />
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-bold">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="recruiters"
          className="scroll-mt-20 overflow-hidden bg-[#000820] px-4 py-12 text-white sm:px-6 sm:py-16"
        >
          <div className="mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-2">
            <Reveal delay={80}>
              <SearchPreview />
            </Reveal>
            <Reveal>
              <Heading
                dark
                eyebrow="FOR RECRUITERS"
                title="Shortlist candidates using proof, not keywords"
                body="Discover professionals by verified ability, review evidence before the first call, and reduce repetitive screening work."
              />
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  "Skill-level filters",
                  "Comparable scores",
                  "Reviewed evidence",
                  "Availability signals",
                ].map((item) => (
                  <div
                    key={item}
                    className="landing-glass-dark flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold text-[#d8e0eb]"
                  >
                    <Check />
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="mt-7 inline-flex h-10 items-center gap-2 rounded-md bg-[#38bdf8] px-5 text-[13px] font-bold text-foreground"
              >
                Create recruiter account <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-12 dark:bg-[#0a1728] sm:px-6 sm:py-16">
          <div className="mx-auto max-w-[1120px]">
            <Reveal>
              <Heading
                center
                eyebrow="PLATFORM CAPABILITIES"
                title="Trust infrastructure for modern hiring"
                body="Everything needed to create, review, discover, and manage verifiable professional evidence."
              />
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(([title, body], index) => (
                <article key={title} className="landing-glass-card rounded-xl p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-[#003bfa]">
                    <FeatureIcon index={index} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#68778a]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 dark:bg-[#0a1728] sm:px-6 sm:pb-16">
          <Reveal>
            <div className="landing-cta-card relative mx-auto max-w-[1120px] overflow-hidden rounded-2xl px-6 py-12 text-center text-white sm:px-10">
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_0%,#1c866e_0,transparent_42%)]" />
              <div className="relative">
                <p className="text-xs font-bold tracking-[.16em] text-[#38bdf8]">
                  START WITH ONE SKILL
                </p>
                <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-[-.035em] sm:text-[38px]">
                  Your skills deserve more than a line on a CV.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
                  Turn real work into professional evidence that recruiters and reviewers can
                  understand.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[#38bdf8] px-5 text-[13px] font-bold text-foreground"
                  >
                    Create your profile <Arrow />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex h-10 items-center rounded-md border border-white/20 px-5 text-[13px] font-semibold"
                  >
                    Discover talent
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Trust({ children }: { children: React.ReactNode }) {
  return (
    <span className="landing-glass-dark flex items-center gap-2 rounded-full px-3 py-1.5">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#38bdf8]/15 text-[#38bdf8]">
        <Check />
      </span>
      {children}
    </span>
  );
}
function Heading({
  eyebrow,
  title,
  body,
  center = false,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p
        className={`text-xs font-bold tracking-[.16em] ${dark ? "text-[#38bdf8]" : "text-[#003bfa]"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl leading-tight font-bold tracking-[-.035em] sm:text-[34px] ${dark ? "text-white" : "text-foreground dark:text-white"}`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-[14px] leading-6 ${dark ? "text-muted" : "text-muted dark:text-muted"}`}
      >
        {body}
      </p>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="landing-media-card relative mx-auto max-w-[460px]">
      <div className="absolute -inset-4 rotate-2 rounded-2xl border border-white/10 bg-white/[.03]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#dce7eb] p-2 shadow-[0_30px_80px_rgba(0,0,0,.32)]">
        <Image
          src="/images/illustrations/proofwork-verification.jpg"
          alt="ProofWork verification network connecting technical assessments, verified skills, and objective data"
          width={1168}
          height={896}
          priority
          sizes="(max-width: 1024px) 90vw, 460px"
          className="h-auto w-full rounded-xl"
        />
      </div>
    </div>
  );
}
function SearchPreview() {
  return (
    <div className="landing-glass-dark overflow-hidden rounded-2xl p-2 shadow-2xl">
      <Image
        src="/images/illustrations/recruiter-interview.jpg"
        alt="A recruiter interviewing a professional candidate in a modern workplace"
        width={1536}
        height={768}
        sizes="(max-width: 1024px) 90vw, 540px"
        className="aspect-video w-full rounded-xl object-cover sm:aspect-[4/3]"
      />
    </div>
  );
}

function Footer() {
  return <SiteFooter />;
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m4 10 3.5 3.5L16 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Search() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="m12.2 12.2 4 4" />
    </svg>
  );
}
function ProcessIcon({ step }: { step: number }) {
  return <span className="font-mono text-sm font-bold">{step + 1}</span>;
}
function FeatureIcon({ index }: { index: number }) {
  return <span className="font-mono text-xs font-bold">0{index + 1}</span>;
}
