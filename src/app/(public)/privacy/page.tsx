import { PolicyPage } from "@/components/marketing/policy-page";

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="LEGAL"
      title="Privacy policy"
      intro="ProofWork handles professional profile, assessment, and account information with care and transparency."
      sections={[
        {
          title: "Information we collect",
          body: "We collect account details, professional profile information, submitted evidence, assessment activity, and necessary technical logs used to operate and secure the platform.",
        },
        {
          title: "How information is used",
          body: "Information is used to provide verification workflows, display profiles according to their visibility settings, connect authorized professionals, prevent abuse, and improve the service.",
        },
        {
          title: "Access and control",
          body: "Users can update their profile information and visibility preferences. Access to sensitive workflows is limited by role-based authorization.",
        },
        {
          title: "Data protection",
          body: "We use reasonable technical and organizational safeguards, restricted server credentials, and auditable access patterns to protect platform information.",
        },
      ]}
    />
  );
}
