import { PolicyPage } from "@/components/marketing/policy-page";

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="LEGAL"
      title="Terms of service"
      intro="These terms define the responsible use of ProofWork and its professional verification workflows."
      sections={[
        {
          title: "Account responsibilities",
          body: "You must provide accurate information, keep account credentials secure, and use only the permissions assigned to your role.",
        },
        {
          title: "Evidence and submissions",
          body: "Submitted work must be your own or properly attributed. Fraudulent evidence, impersonation, and attempts to manipulate verification outcomes are prohibited.",
        },
        {
          title: "Verification decisions",
          body: "Assessment results reflect performance against published criteria. ProofWork may review, correct, or revoke outcomes when evidence of error or abuse exists.",
        },
        {
          title: "Acceptable use",
          body: "You may not disrupt the service, access data without authorization, scrape restricted information, or use ProofWork to harm candidates, reviewers, recruiters, or organizations.",
        },
      ]}
    />
  );
}
