import type { Metadata } from "next";

import { PolicyPage } from "@/components/marketing/policy-page";

export const metadata: Metadata = {
  title: "Security",
};

export default async function SecurityPage() {
  return (
    <PolicyPage
      eyebrow="TRUST CENTER"
      title="Security at ProofWork"
      intro="Verification is only valuable when the systems and permissions behind it are trustworthy."
      sections={[
        {
          title: "Role-based authorization",
          body: "Candidate, reviewer, recruiter, and administrator capabilities are separated. Reviewer authority is granted rather than self-assigned.",
        },
        {
          title: "Protected credentials",
          body: "Database, storage, OAuth, and service-role credentials remain server-side and are never intentionally exposed to the browser.",
        },
        {
          title: "Auditability",
          body: "Important appointments, submissions, reviews, and administrative actions are designed to remain attributable through structured records.",
        },
        {
          title: "Reporting a concern",
          body: "If you discover a potential vulnerability, report it privately by email. Do not access, alter, or disclose data that does not belong to you.",
        },
      ]}
    />
  );
}
