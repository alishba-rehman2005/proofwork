import { z } from "zod";

export const EVIDENCE_TYPES = [
  "GITHUB_REPOSITORY",
  "LIVE_DEPLOYMENT",
  "FIGMA_URL",
  "SCREENSHOT",
  "DOCUMENT",
  "OTHER",
] as const;

export const EVIDENCE_TYPE_OPTIONS = [
  { value: "GITHUB_REPOSITORY", label: "GitHub repository" },
  { value: "LIVE_DEPLOYMENT", label: "Live deployment" },
  { value: "FIGMA_URL", label: "Figma file" },
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "DOCUMENT", label: "Documentation" },
  { value: "OTHER", label: "Other" },
] as const;

const evidenceUrl = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL." }));

const optionalEvidenceUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.url({ protocol: /^https?$/ }).safeParse(value).success,
    "Enter a valid http(s) URL.",
  )
  .transform((value) => (value === "" ? null : value));

/**
 * A submission must carry at least one piece of evidence.
 *
 * A reviewer cannot score work they cannot see, so an empty submission is
 * rejected at the boundary rather than reaching the review queue.
 */
export const submissionSchema = z
  .object({
    assignmentId: z.uuid(),

    githubUrl: optionalEvidenceUrl,
    liveUrl: optionalEvidenceUrl,
    figmaUrl: optionalEvidenceUrl,
    documentUrl: optionalEvidenceUrl,

    notes: z
      .string()
      .trim()
      .max(2000, "Notes must not exceed 2000 characters.")
      .transform((value) => (value === "" ? null : value)),
  })
  .refine((data) => Boolean(data.githubUrl || data.liveUrl || data.figmaUrl || data.documentUrl), {
    path: ["githubUrl"],
    message: "Provide at least one link so the reviewer can see your work.",
  });

export const addEvidenceSchema = z.object({
  submissionId: z.uuid(),
  type: z.enum(EVIDENCE_TYPES),
  title: z
    .string()
    .trim()
    .max(150)
    .transform((value) => (value === "" ? null : value)),
  url: evidenceUrl,
});

export const REVIEW_OUTCOMES = ["APPROVED", "CHANGES_REQUESTED", "REJECTED"] as const;

export const REVIEW_OUTCOME_OPTIONS = [
  { value: "APPROVED", label: "Approve and verify the skill" },
  { value: "CHANGES_REQUESTED", label: "Request changes" },
  { value: "REJECTED", label: "Reject" },
] as const;

export const reviewSchema = z.object({
  submissionId: z.uuid(),
  outcome: z.enum(REVIEW_OUTCOMES),
  candidateFeedback: z
    .string()
    .trim()
    .min(20, "Give the candidate at least 20 characters of useful feedback.")
    .max(4000),
  internalNotes: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value === "" ? null : value)),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
