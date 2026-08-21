import Link from "next/link";
import type { ReactNode } from "react";

/*
|--------------------------------------------------------------------------
| AUTH BRAND PANEL
|--------------------------------------------------------------------------
| The decorative half of the split auth layout, shared by sign in, register
| and password recovery so the three pages cannot drift apart.
|
| This surface is intentionally dark in both themes. It is a brand panel
| rather than app chrome, so it keeps its own constant palette while every
| interactive surface next to it uses the theme tokens.
*/

const PANEL_BG = "#000820";
const ACCENT = "#38bdf8";

type Benefit = { title: string; body: string; icon: ReactNode };

const PLATFORM_BENEFITS: Benefit[] = [
  {
    title: "Evidence-backed verification",
    body: "Skills are validated through practical work and expert review.",
    icon: <ShieldCheckIcon />,
  },
  {
    title: "Objective performance signals",
    body: "Structured rubric scores replace vague, self-reported ability.",
    icon: <MetricsIcon />,
  },
  {
    title: "Trusted professional connections",
    body: "Candidates connect with mentors and approved recruiters.",
    icon: <NetworkIcon />,
  },
];

const SIGN_IN_BENEFITS: Benefit[] = [
  {
    title: "Continue where you left off",
    body: "Return to assessments, reviews, projects, and hiring activity.",
    icon: <ProgressIcon />,
  },
  {
    title: "A workspace built for your role",
    body: "Candidates, reviewers, recruiters, and admins see the tools they need.",
    icon: <WorkspaceIcon />,
  },
  {
    title: "Secure, permission-based access",
    body: "Protected actions are checked against your live account permissions.",
    icon: <ShieldCheckIcon />,
  },
];

export function AuthBrandPanel({
  heading,
  body,
  variant = "platform",
}: {
  heading: string;
  body: string;
  variant?: "platform" | "sign-in";
}) {
  const isSignIn = variant === "sign-in";
  const benefits = isSignIn ? SIGN_IN_BENEFITS : PLATFORM_BENEFITS;

  return (
    <aside
      className="relative hidden min-h-full w-full overflow-hidden px-9 py-8 text-white lg:flex lg:max-w-[520px] lg:flex-col"
      style={{ backgroundColor: PANEL_BG }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(129,155,190,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(129,155,190,.07) 1px,transparent 1px),radial-gradient(circle at 88% 8%,#21456f 0,transparent 38%)",
          backgroundSize: "52px 52px,52px 52px,auto",
        }}
      />

      {/* The wordmark doubles as the way back to the marketing site. */}
      <Link href="/" className="relative flex items-center gap-3 rounded-lg">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10">
          <VerificationMark />
        </span>

        <span>
          <span className="block text-[22px] font-extrabold tracking-[-0.04em]">ProofWork</span>
          <span className="mt-0.5 block text-[11px] font-semibold tracking-[0.16em] text-[#9fb0c8]">
            PROFESSIONAL VERIFICATION
          </span>
        </span>
      </Link>

      <div className="relative my-auto max-w-[440px]">
        <span
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-[0.12em]"
          style={{ borderColor: `${ACCENT}33`, backgroundColor: `${ACCENT}1a`, color: ACCENT }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          {isSignIn ? "SECURE WORKSPACE" : "TRUST INFRASTRUCTURE"}
        </span>

        <h2 className="text-[24px] leading-[1.25] font-semibold tracking-[-0.025em]">{heading}</h2>

        <p className="mt-3 text-[13px] leading-5 text-[#aebdd1]">{body}</p>

        <ul className="mt-7 grid gap-4">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
              >
                {benefit.icon}
              </span>

              <span>
                <strong className="block text-[13px] font-semibold text-[#f4f7fb]">
                  {benefit.title}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto border-t border-white/15 pt-5 text-[11px] font-semibold text-[#9fb0c8]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
            All verification systems operational
          </span>

          <Link href="/" className="font-mono text-[#7488a5] hover:text-white">
            proofwork.app
          </Link>
        </div>
      </div>
    </aside>
  );
}

function VerificationMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m12 2.8 2.2 1.6 2.8-.2.8 2.6 2.3 1.7-1 2.6 1 2.6-2.3 1.7-.8 2.6-2.8-.2-2.2 1.6-2.2-1.6-2.8.2-.8-2.6-2.3-1.7 1-2.6-1-2.6 2.3-1.7.8-2.6 2.8.2L12 2.8Z" />
      <path d="m8.7 11.8 2.1 2.1 4.6-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 4.5 6v5.2c0 4.5 3.1 7.8 7.5 9.8 4.4-2 7.5-5.3 7.5-9.8V6L12 3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" strokeLinecap="round" />
      <path d="m4 6 5-3 6 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.8 20v-1.3A5.2 5.2 0 0 1 8 13.5a5.2 5.2 0 0 1 5.2 5.2V20M14 13.2a4.6 4.6 0 0 1 7.2 3.8v1" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 12a7 7 0 1 0 2-5" strokeLinecap="round" />
      <path d="M5 4v5h5M9 12l2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 4v16M8 9h13M11 13h6M11 16h4" strokeLinecap="round" />
    </svg>
  );
}
