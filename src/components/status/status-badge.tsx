import { Badge, type BadgeTone } from "@/components/ui";

/*
|--------------------------------------------------------------------------
| STATUS BADGES
|--------------------------------------------------------------------------
| The palette is monochrome, so status is where colour is spent. The rules:
|
|   solid ink  - terminal success (Verified, Approved). Strongest signal on
|                the page, and only ever means "this is proven".
|   outline    - in flight (assigned, in progress, submitted, under review)
|   neutral    - nothing has happened yet (Unverified, Draft)
|   danger     - rejected or expired, the only genuinely coloured state
|
| Every badge carries a glyph as well as a tone so the meaning survives for
| anyone who cannot distinguish the colours.
*/

type StatusPresentation = { label: string; tone: BadgeTone; glyph: string };

const SKILL_STATUS: Record<string, StatusPresentation> = {
  UNVERIFIED: { label: "Unverified", tone: "neutral", glyph: "○" },
  ASSESSMENT_ASSIGNED: { label: "Assessment assigned", tone: "outline", glyph: "◔" },
  IN_PROGRESS: { label: "In progress", tone: "outline", glyph: "◑" },
  SUBMITTED: { label: "Submitted", tone: "outline", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "outline", glyph: "◕" },
  VERIFIED: { label: "Verified", tone: "solid", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const ASSIGNMENT_STATUS: Record<string, StatusPresentation> = {
  ASSIGNED: { label: "Assigned", tone: "outline", glyph: "◔" },
  IN_PROGRESS: { label: "In progress", tone: "outline", glyph: "◑" },
  SUBMITTED: { label: "Submitted", tone: "outline", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "outline", glyph: "◕" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning", glyph: "↺" },
  APPROVED: { label: "Approved", tone: "solid", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
  EXPIRED: { label: "Expired", tone: "danger", glyph: "⏱" },
  CANCELLED: { label: "Cancelled", tone: "neutral", glyph: "—" },
};

const SUBMISSION_STATUS: Record<string, StatusPresentation> = {
  SUBMITTED: { label: "Submitted", tone: "outline", glyph: "◕" },
  UNDER_REVIEW: { label: "Under review", tone: "outline", glyph: "◕" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning", glyph: "↺" },
  APPROVED: { label: "Approved", tone: "solid", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const PROJECT_STATUS: Record<string, StatusPresentation> = {
  UNVERIFIED: { label: "Unverified", tone: "neutral", glyph: "○" },
  UNDER_REVIEW: { label: "Under review", tone: "outline", glyph: "◕" },
  VERIFIED: { label: "Verified", tone: "solid", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

const REQUEST_STATUS: Record<string, StatusPresentation> = {
  PENDING: { label: "Pending", tone: "outline", glyph: "◔" },
  ASSESSMENT_ASSIGNED: { label: "Assessment assigned", tone: "outline", glyph: "◑" },
  IN_PROGRESS: { label: "In progress", tone: "outline", glyph: "◑" },
  COMPLETED: { label: "Completed", tone: "solid", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
  CANCELLED: { label: "Cancelled", tone: "neutral", glyph: "—" },
};

const ASSESSMENT_STATUS: Record<string, StatusPresentation> = {
  DRAFT: { label: "Draft", tone: "neutral", glyph: "○" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "outline", glyph: "◔" },
  PUBLISHED: { label: "Published", tone: "solid", glyph: "✓" },
  ARCHIVED: { label: "Archived", tone: "neutral", glyph: "—" },
};

const COMPANY_STATUS: Record<string, StatusPresentation> = {
  PENDING: { label: "Pending", tone: "warning", glyph: "◔" },
  ACTIVE: { label: "Active", tone: "solid", glyph: "✓" },
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
