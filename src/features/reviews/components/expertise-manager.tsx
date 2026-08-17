"use client";

import { useActionState } from "react";

import { Badge, Button, EmptyState, FormStatus, SelectField, SubmitButton } from "@/components/ui";

import {
  grantReviewerSkillAction,
  revokeReviewerSkillAction,
  type ExpertiseActionState,
} from "../actions/expertise.actions";
import type { ReviewerWithExpertise } from "../expertise";

const initialState: ExpertiseActionState = {};

/**
 * Admin control over who may verify what.
 *
 * Each reviewer is listed with the skills they hold, because the decision an
 * admin is making is "does this person understand this skill", which needs the
 * existing grants visible alongside the new one.
 */
export function ExpertiseManager({
  reviewers,
  skills,
}: {
  reviewers: ReviewerWithExpertise[];
  skills: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(grantReviewerSkillAction, initialState);

  if (reviewers.length === 0) {
    return (
      <EmptyState
        title="No reviewers yet"
        description="Appoint a reviewer above before granting verification rights."
      />
    );
  }

  return (
    <div className="space-y-5">
      <form action={action} className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Reviewer"
          name="reviewerId"
          disabled={pending}
          options={reviewers.map((reviewer) => ({
            value: reviewer.userId,
            label: reviewer.name ?? reviewer.email,
          }))}
          error={state.errors?.reviewerId?.[0]}
        />

        <SelectField
          label="Skill they may verify"
          name="skillId"
          disabled={pending}
          options={skills.map((skill) => ({ value: skill.id, label: skill.name }))}
          error={state.errors?.skillId?.[0]}
        />

        <div className="flex items-end">
          <SubmitButton pending={pending} idleLabel="Grant" pendingLabel="Granting..." />
        </div>
      </form>

      <FormStatus success={state.success} message={state.message} />

      <ul className="space-y-3">
        {reviewers.map((reviewer) => {
          const active = reviewer.grants.filter((grant) => grant.canVerify);

          return (
            <li key={reviewer.userId} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{reviewer.name ?? reviewer.email}</p>
                  <p className="text-xs text-muted">{reviewer.email}</p>
                </div>

                <Badge tone={active.length > 0 ? "success" : "warning"}>
                  {active.length} skill{active.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {active.length === 0 ? (
                <p className="mt-3 text-sm text-warning">
                  Cannot verify anything yet - their review queue will be empty.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {active.map((grant) => (
                    <li key={grant.id}>
                      <form action={revokeReviewerSkillAction} className="inline-flex">
                        <input type="hidden" name="grantId" value={grant.id} />

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-0.5 ps-2.5 pe-1 text-xs font-medium text-accent">
                          {grant.skillName}

                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 rounded-full !px-0 text-accent hover:bg-accent/20"
                            title={`Revoke ${grant.skillName}`}
                            aria-label={`Revoke ${grant.skillName}`}
                          >
                            ×
                          </Button>
                        </span>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
