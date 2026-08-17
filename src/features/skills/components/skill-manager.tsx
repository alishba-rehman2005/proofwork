"use client";

import { useActionState, useState } from "react";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Button,
  EmptyState,
  FormStatus,
  SelectField,
  SubmitButton,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  SegmentBar,
  TextAreaField,
  TextField,
} from "@/components/ui";

import {
  addCandidateSkillAction,
  removeCandidateSkillAction,
  requestNewSkillAction,
  requestVerificationAction,
  updateCandidateSkillAction,
  type SkillActionState,
} from "../actions/skills.actions";
import type { CandidateSkillRow, SkillOption } from "../server/skills.queries";
import { EXPERIENCE_LEVEL_OPTIONS } from "../validation/skill.schema";
import { formatDate } from "@/lib/format";

const initialState: SkillActionState = {};

/** Statuses where the candidate can still act on the skill themselves. */
const EDITABLE = new Set(["UNVERIFIED", "REJECTED"]);

export function AddSkillForm({ available }: { available: SkillOption[] }) {
  const [state, action, pending] = useActionState(addCandidateSkillAction, initialState);

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted">
        Every catalogue skill is already on your profile. Suggest a new one below.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Skill"
          name="skillId"
          required
          disabled={pending}
          error={state.errors?.skillId?.[0]}
          options={available.map((skill) => ({
            value: skill.id,
            label: skill.categoryName ? `${skill.name} · ${skill.categoryName}` : skill.name,
          }))}
        />

        <SelectField
          label="Experience level"
          name="experienceLevel"
          defaultValue="INTERMEDIATE"
          disabled={pending}
          error={state.errors?.experienceLevel?.[0]}
          options={[...EXPERIENCE_LEVEL_OPTIONS]}
        />
      </div>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Add skill" pendingLabel="Adding..." />
    </form>
  );
}

export function SkillTable({ rows }: { rows: CandidateSkillRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No skills yet"
        description="Add a skill above, then request verification to prove it with a practical assessment."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Skill / technology</TH>
          <TH>Category</TH>
          <TH>Status</TH>
          <TH>Confidence level</TH>
          <TH className="text-right">Score</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>

      <TBody>
        {rows.map((row) => (
          <SkillRow key={row.id} row={row} />
        ))}
      </TBody>
    </Table>
  );
}

function SkillRow({ row }: { row: CandidateSkillRow }) {
  const [expanded, setExpanded] = useState(false);
  const [state, action, pending] = useActionState(requestVerificationAction, initialState);
  const [levelState, levelAction, levelPending] = useActionState(
    updateCandidateSkillAction,
    initialState,
  );

  const editable = EDITABLE.has(row.verificationStatus);
  const message = state.message ?? levelState.message;
  const succeeded = state.success ?? levelState.success;

  return (
    <>
      <TR>
        <TD>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-[11px] font-bold text-muted"
            >
              {row.skillName.slice(0, 2).toUpperCase()}
            </span>

            <span className="min-w-0">
              <span className="block font-medium">{row.skillName}</span>

              <span className="block text-xs text-faint">
                {row.verifiedAt
                  ? `Verified ${formatDate(row.verifiedAt)}`
                  : row.projectsCompleted > 0
                    ? `${row.projectsCompleted} assessment(s) passed`
                    : "Self-reported"}
              </span>
            </span>
          </div>
        </TD>

        <TD className="text-sm font-medium text-info">{row.categoryName ?? "—"}</TD>

        <TD>
          <StatusBadge kind="skill" status={row.verificationStatus} />
        </TD>

        <TD>
          <div className="flex items-center gap-2">
            <SegmentBar level={row.experienceLevel} muted={!row.currentScore} />

            <span className="text-xs text-muted capitalize">
              {row.experienceLevel.toLowerCase()}
            </span>
          </div>
        </TD>

        <TD className="tabular text-right">
          {row.currentScore ? `${Number(row.currentScore).toFixed(0)}/100` : "—"}
        </TD>

        <TD>
          <div className="flex flex-wrap justify-end gap-2">
            {editable && (
              <form action={action}>
                <input type="hidden" name="candidateSkillId" value={row.id} />

                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Requesting..." : "Request verification"}
                </Button>
              </form>
            )}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
            >
              {expanded ? "Hide" : "Details"}
            </Button>
          </div>
        </TD>
      </TR>

      {expanded && (
        <TR>
          <TD colSpan={6} className="bg-surface-muted/50">
            <div className="space-y-4 py-2">
              {row.deadline && (
                <p className="text-sm text-muted">
                  Assessment deadline:{" "}
                  <span className="text-foreground">{formatDate(row.deadline)}</span>
                </p>
              )}

              {row.reviewerFeedback ? (
                <div>
                  <p className="text-sm font-medium">Reviewer feedback</p>

                  <p className="mt-1 text-sm whitespace-pre-wrap text-muted">
                    {row.reviewerFeedback}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">No reviewer feedback yet.</p>
              )}

              {editable && (
                <form action={levelAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="candidateSkillId" value={row.id} />

                  <div className="w-48">
                    <SelectField
                      label="Experience level"
                      name="experienceLevel"
                      defaultValue={row.experienceLevel}
                      disabled={levelPending}
                      options={[...EXPERIENCE_LEVEL_OPTIONS]}
                    />
                  </div>

                  <SubmitButton
                    pending={levelPending}
                    idleLabel="Update"
                    pendingLabel="Saving..."
                    variant="secondary"
                  />

                  <button
                    type="submit"
                    formAction={removeCandidateSkillAction}
                    formNoValidate
                    className="rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                  >
                    Remove
                  </button>
                </form>
              )}

              <FormStatus success={succeeded} message={message} />
            </div>
          </TD>
        </TR>
      )}
    </>
  );
}

export function SkillRequestForm() {
  const [state, action, pending] = useActionState(requestNewSkillAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField
        label="Skill name"
        name="proposedName"
        required
        disabled={pending}
        placeholder="e.g. Rust"
        error={state.errors?.proposedName?.[0]}
      />

      <TextAreaField
        label="Why should it be added?"
        name="description"
        rows={3}
        disabled={pending}
        placeholder="Optional context for the admin reviewing this."
        error={state.errors?.description?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton
        pending={pending}
        idleLabel="Suggest skill"
        pendingLabel="Sending..."
        variant="secondary"
      />
    </form>
  );
}
