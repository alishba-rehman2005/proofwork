import { Badge, type BadgeTone } from "@/components/ui";

/*
|--------------------------------------------------------------------------
| STATUS BADGES
|--------------------------------------------------------------------------
| The palette is monochrome, so status is where colour is spent. The rules:
|
|   success (green)  - proven: Verified, Approved, Published
|   warning (amber)  - waiting on a human: submitted, under review, pending
|   accent  (violet) - work in flight: assigned, in progress
|   neutral (grey)   - nothing has happened yet: Unverified, Draft
|   danger  (red)    - rejected or expired
|
| Every badge carries a glyph as well as a tone so the meaning survives for
| anyone who cannot distinguish the colours.
*/

type StatusPresentation = { label: string; tone: BadgeTone; glyph: string };

const SKILL_STATUS: Record<string, StatusPresentation> = {
  UNVERIFIED: { label: "Unverified", tone: "neutral", glyph: "○" },
  ASSESSMENT_ASSIGNED: { label: "Assigned", tone: "accent", glyph: "◔" },
  IN_PROGRESS: { label: "In progress", tone: "accent", glyph: "◑" },
  SUBMITTED: { label: "Submitted", tone: "warning", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "warning", glyph: "◕" },
  VERIFIED: { label: "Verified", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const ASSIGNMENT_STATUS: Record<string, StatusPresentation> = {
  ASSIGNED: { label: "Assigned", tone: "accent", glyph: "◔" },
  IN_PROGRESS: { label: "In progress", tone: "accent", glyph: "◑" },
  SUBMITTED: { label: "Submitted", tone: "warning", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "warning", glyph: "◕" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning", glyph: "↺" },
  APPROVED: { label: "Approved", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
  EXPIRED: { label: "Expired", tone: "danger", glyph: "⏱" },
  CANCELLED: { label: "Cancelled", tone: "neutral", glyph: "—" },
};

const SUBMISSION_STATUS: Record<string, StatusPresentation> = {
  SUBMITTED: { label: "Submitted", tone: "warning", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "warning", glyph: "◕" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning", glyph: "↺" },
  APPROVED: { label: "Approved", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const PROJECT_STATUS: Record<string, StatusPresentation> = {
  UNVERIFIED: { label: "Unverified", tone: "neutral", glyph: "○" },
  UNDER_REVIEW: { label: "Under review", tone: "warning", glyph: "◕" },
  VERIFIED: { label: "Verified", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const REQUEST_STATUS: Record<string, StatusPresentation> = {
  PENDING: { label: "Pending", tone: "warning", glyph: "◔" },
  ASSESSMENT_ASSIGNED: { label: "Assigned", tone: "accent", glyph: "◑" },
  IN_PROGRESS: { label: "In progress", tone: "accent", glyph: "◑" },
  COMPLETED: { label: "Completed", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
  CANCELLED: { label: "Cancelled", tone: "neutral", glyph: "—" },
};

const ASSESSMENT_STATUS: Record<string, StatusPresentation> = {
  DRAFT: { label: "Draft", tone: "neutral", glyph: "○" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "warning", glyph: "◔" },
  PUBLISHED: { label: "Published", tone: "success", glyph: "✓" },
  ARCHIVED: { label: "Archived", tone: "neutral", glyph: "—" },
};

const COMPANY_STATUS: Record<string, StatusPresentation> = {
  PENDING: { label: "Pending", tone: "warning", glyph: "◔" },
  ACTIVE: { label: "Active", tone: "success", glyph: "✓" },
  SUSPENDED: { label: "Suspended", tone: "danger", glyph: "✕" },
  ARCHIVED: { label: "Archived", tone: "neutral", glyph: "—" },
};

const MAPS = {
  skill: SKILL_STATUS,
  assignment: ASSIGNMENT_STATUS,
  submission: SUBMISSION_STATUS,
  project: PROJECT_STATUS,
  request: REQUEST_STATUS,
  assessment: ASSESSMENT_STATUS,
  company: COMPANY_STATUS,
} as const;

export type StatusKind = keyof typeof MAPS;

const FALLBACK: StatusPresentation = { label: "Unknown", tone: "neutral", glyph: "?" };

export function StatusBadge({ kind, status }: { kind: StatusKind; status: string }) {
  const presentation = MAPS[kind][status] ?? FALLBACK;

  return (
    <Badge tone={presentation.tone}>
      <span aria-hidden="true">{presentation.glyph}</span>
      {presentation.label}
    </Badge>
  );
}

/** Plain label lookup, for places where a badge would be too heavy. */
export function statusLabel(kind: StatusKind, status: string): string {
  return (MAPS[kind][status] ?? FALLBACK).label;
}

/** True when a skill has reached its terminal verified state. */
export function isVerified(status: string): boolean {
  return status === "VERIFIED";
}
