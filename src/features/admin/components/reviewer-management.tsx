"use client";

import { useActionState } from "react";

import { Button, EmptyState } from "@/components/ui";

import {
  appointReviewerAction,
  revokeReviewerAction,
  type AdminActionState,
} from "../actions/admin.actions";
import type { ReviewerSummary } from "../server/admin.queries";

const initialState: AdminActionState = {};

export function ReviewerManagement({ reviewers }: { reviewers: ReviewerSummary[] }) {
  const [state, action, pending] = useActionState(appointReviewerAction, initialState);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-3">
        <label htmlFor="reviewer-email" className="text-sm font-medium">
          Appoint a reviewer
        </label>

        <div className="flex flex-wrap gap-3">
          <input
            id="reviewer-email"
            name="email"
            type="email"
            required
            disabled={pending}
            placeholder="reviewer@example.com"
            className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 outline-none focus:border-primary disabled:bg-surface-muted"
          />

          <Button type="submit" disabled={pending}>
            {pending ? "Appointing..." : "Appoint"}
          </Button>
        </div>

        <p className="text-xs text-muted">
          The person must already have an account. Reviewers can mark a skill as verified, so the
          role is granted here rather than at signup.
        </p>

        {state.message && (
          <p role="status" className={`text-sm ${state.success ? "text-success" : "text-danger"}`}>
            {state.message}
          </p>
        )}
      </form>

      {reviewers.length === 0 ? (
        <EmptyState title="No reviewers yet" description="Appoint one using the field above." />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {reviewers.map((reviewer) => (
            <li key={reviewer.userId}>
              <ReviewerRow reviewer={reviewer} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewerRow({ reviewer }: { reviewer: ReviewerSummary }) {
  const [state, action, pending] = useActionState(revokeReviewerAction, initialState);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{reviewer.email}</p>

        {state.message && (
          <p
            role="status"
            className={`mt-1 text-xs ${state.success ? "text-success" : "text-danger"}`}
          >
            {state.message}
          </p>
        )}
      </div>

      <form action={action}>
        <input type="hidden" name="userId" value={reviewer.userId} />

        <Button type="submit" variant="ghost" disabled={pending}>
          {pending ? "Revoking..." : "Revoke"}
        </Button>
      </form>
    </div>
  );
}
