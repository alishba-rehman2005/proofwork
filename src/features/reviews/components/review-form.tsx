"use client";

import { useActionState, useState } from "react";

import {
  Alert,
  Button,
  FormStatus,
  SelectField,
  SubmitButton,
  TextAreaField,
  controlClassName,
} from "@/components/ui";
import { REVIEW_OUTCOME_OPTIONS } from "@/features/submissions/validation/submission.schema";

import {
  claimReviewAction,
  submitReviewAction,
  type ReviewActionState,
} from "../actions/review.actions";
import { calculateScore } from "../scoring";

const initialState: ReviewActionState = {};

export function ClaimReviewButton({ submissionId }: { submissionId: string }) {
  return (
    <form action={claimReviewAction}>
      <input type="hidden" name="submissionId" value={submissionId} />

      <Button type="submit">Start review</Button>
    </form>
  );
}

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  maximumPoints: string;
  weight: string;
};

export function ReviewForm({
  submissionId,
  criteria,
  maximumScore,
  passingScore,
}: {
  submissionId: string;
  criteria: Criterion[];
  maximumScore: number;
  passingScore: number;
}) {
  const [state, action, pending] = useActionState(submitReviewAction, initialState);

  // Mirrors the server calculation so the reviewer sees the consequence of
  // their scores before they commit to an outcome.
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(criteria.map((criterion) => [criterion.id, 0])),
  );

  const preview = calculateScore(
    criteria.map((criterion) => ({
      criterionId: criterion.id,
      score: scores[criterion.id] ?? 0,
      maximumPoints: Number(criterion.maximumPoints),
      weight: Number(criterion.weight),
    })),
    maximumScore,
    passingScore,
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="submissionId" value={submissionId} />

      <ul className="space-y-4">
        {criteria.map((criterion) => {
          const max = Number(criterion.maximumPoints);

          return (
            <li key={criterion.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{criterion.name}</p>

                  {criterion.description && (
                    <p className="mt-1 text-sm text-muted">{criterion.description}</p>
                  )}

                  <p className="mt-1 text-xs text-muted">
                    Max {max} pts · weight {Number(criterion.weight)}%
                  </p>
                </div>

                <div className="w-28">
                  <label htmlFor={`score_${criterion.id}`} className="text-xs font-medium">
                    Score
                  </label>

                  <input
                    id={`score_${criterion.id}`}
                    name={`score_${criterion.id}`}
                    type="number"
                    min={0}
                    max={max}
                    step="0.5"
                    required
                    disabled={pending}
                    value={scores[criterion.id] ?? 0}
                    onChange={(event) =>
                      setScores((current) => ({
                        ...current,
                        [criterion.id]: Number(event.target.value),
                      }))
                    }
                    className={`${controlClassName} tabular mt-1`}
                  />
                </div>
              </div>

              <textarea
                name={`comment_${criterion.id}`}
                rows={2}
                disabled={pending}
                placeholder="Optional comment on this criterion"
                className={`${controlClassName} mt-3`}
              />
            </li>
          );
        })}
      </ul>

      <div className="rounded-xl border border-line bg-surface-muted p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Calculated score</p>

            <p className="tabular text-2xl font-semibold">
              {preview.totalScore} / {maximumScore}
            </p>
          </div>

          <p className={`text-sm font-medium ${preview.passed ? "text-success" : "text-danger"}`}>
            {preview.passed
              ? `Above the ${passingScore} pass mark`
              : `Below the ${passingScore} pass mark`}
          </p>
        </div>

        {!preview.passed && (
          <p className="mt-2 text-xs text-muted">
            Approving is blocked below the pass mark. Request changes or reject instead.
          </p>
        )}
      </div>

      <SelectField
        label="Outcome"
        name="outcome"
        defaultValue="APPROVED"
        disabled={pending}
        options={[...REVIEW_OUTCOME_OPTIONS]}
      />

      <TextAreaField
        label="Feedback for the candidate"
        name="candidateFeedback"
        rows={5}
        required
        disabled={pending}
        hint="This is shown on their skill. Be specific about what was good and what to improve."
        error={state.errors?.candidateFeedback?.[0]}
      />

      <TextAreaField
        label="Internal notes"
        name="internalNotes"
        rows={3}
        disabled={pending}
        hint="Only visible to reviewers and admins."
        error={state.errors?.internalNotes?.[0]}
      />

      {state.message && !state.success && <Alert tone="danger">{state.message}</Alert>}

      <FormStatus success={state.success} message={state.success ? state.message : undefined} />

      <SubmitButton pending={pending} idleLabel="Submit review" pendingLabel="Submitting..." />
    </form>
  );
}
