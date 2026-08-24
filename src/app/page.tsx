import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

import { Reveal } from "@/components/motion/reveal";
import { getPublicStats } from "@/features/marketing/server/marketing.queries";

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

  /*
    The landing page is the one route that must render even when the database
    is unreachable, so a failed count degrades to a hidden strip rather than an
    error page.
  */
  const stats = await getPublicStats().catch(() => null);

  const proofPoints = stats
    ? ([
        ["Verified skills", stats.verifiedSkills],
        ["Reviewed assessments", stats.reviewedAssessments],
        ["Verified projects", stats.verifiedProjects],
        ["Candidate profiles", stats.candidates],
      ] as const)
    : [];

  // Nothing verified yet means no honest number to show, so the strip is
  // omitted entirely rather than padded with invented figures.
  const showProofPoints = proofPoints.some(([, value]) => value > 0);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader signedIn={Boolean(session?.user)} />

      <main>
        <section className="relative flex items-center overflow-hidden border-b border-line bg-surface">
          <div className="absolute inset-0 opacity-[0.25] dark:opacity-40 [background-image:linear-gradient(rgba(140,166,199,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(140,166,199,.06)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -top-40 right-[-8%] h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/10" />
          <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24 lg:grid-cols-[1.05fr_.95fr]">
            <div className="animate-rise max-w-[650px]">
              <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[52px] lg:text-[60px]">
                Your skills deserve
                <br className="hidden sm:block" />{" "}
                <span className="text-primary">credible proof.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-base leading-7 text-muted sm:mt-6 sm:text-[17px] sm:leading-8">
                Complete real assessments, receive structured expert reviews, and build a
                professional profile backed by evidence—not self-reported claims.
              </p>
              <div className="mt-6 grid gap-2.5 sm:mt-7 sm:flex sm:flex-wrap">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
                >
                  Create your profile <Arrow />
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-6 text-[15px] font-semibold text-foreground shadow-xs transition-all duration-200 hover:border-line-strong hover:bg-surface-muted"
                >
                  <Search />
                  Explore verified talent
                </Link>
              </div>
              <div className="mt-8 grid gap-2.5 border-t border-line pt-6 text-sm text-muted sm:flex sm:flex-wrap sm:gap-x-6">
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

        {showProofPoints && (
          <section
            aria-label="Platform activity"
            className="border-b border-line bg-surface-muted px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
          >
            <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
              {proofPoints.map(([label, value], index) => (
                <Reveal key={label} delay={index * 60}>
                  <p className="text-[30px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[38px]">
                    {formatCount(value)}
                  </p>
                  <p className="mt-2 text-sm text-muted">{label}</p>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <section
          id="how-it-works"
          className="scroll-mt-20 bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <Heading
                center
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
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary-soft text-primary">
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
          className="scroll-mt-20 overflow-hidden border-y border-line bg-surface-muted px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
            <Reveal delay={80}>
              <SearchPreview />
            </Reveal>
            <Reveal>
              <Heading
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
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium"
                  >
                    <Check />
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
              >
                Create recruiter account <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>

        <section className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FeatureIcon index={index} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <Reveal>
            <div className="landing-cta-card relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl px-6 py-12 text-center text-white sm:px-10">
              <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_50%_0%,#4c7dff_0,transparent_50%)]" />
              <div className="relative">
                <p className="text-xs font-bold tracking-[.16em] text-[#8fb0ff]">
                  START WITH ONE SKILL
                </p>
                <h2 className="mx-auto mt-3 max-w-3xl text-[28px] leading-[1.15] font-bold tracking-[-0.035em] sm:text-[36px] lg:text-[40px]">
                  Your skills deserve more than a line on a CV.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#c3cee4]">
                  Turn real work into professional evidence that recruiters and reviewers can
                  understand.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
                  >
                    Create your profile <Arrow />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex h-12 items-center rounded-lg border border-white/25 px-6 text-[15px] font-semibold transition-colors duration-200 hover:border-white/50 hover:bg-white/10"
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
    <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
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
}: {
  eyebrow: string;
  title: string;
  body: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-bold tracking-[.16em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] leading-[1.15] font-bold tracking-[-0.035em] sm:text-[36px] lg:text-[40px]">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted">{body}</p>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="landing-media-card relative mx-auto max-w-[460px]">
      <div className="absolute -inset-4 rotate-2 rounded-2xl border border-line bg-surface-muted/60" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-muted p-2 shadow-lg">
        <Image
          src="/images/illustrations/proofwork-verification.jpg"
          alt="ProofWork verification network connecting technical assessments, verified skills, and objective data"
          width={1168}
          height={896}
          priority
          sizes="(max-width: 1024px) 90vw, 460px"
          className="h-auto w-full rounded-xl [filter:grayscale(.55)_hue-rotate(72deg)_saturate(1.35)]"
        />
      </div>
    </div>
  );
}
function SearchPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-lg">
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

/**
 * Grouped with an explicit locale: `toLocaleString()` with no argument reads
 * the host locale, which differs between the server and the browser and
 * triggers a hydration mismatch.
 */
function formatCount(value: number) {
  return value.toLocaleString("en-US");
}
