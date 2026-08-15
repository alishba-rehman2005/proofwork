"use client";

import { useActionState } from "react";

import { Alert, Button, FormStatus, SubmitButton, TextAreaField, TextField } from "@/components/ui";

import {
  startAssessmentAction,
  submitAssessmentAction,
  withdrawSubmissionAction,
  type SubmissionActionState,
} from "../actions/submission.actions";

const initialState: SubmissionActionState = {};

export function StartAssessmentButton({ assignmentId }: { assignmentId: string }) {
  return (
    <form action={startAssessmentAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <Button type="submit">Start assessment</Button>
    </form>
  );
}

export function WithdrawSubmissionButton({ submissionId }: { submissionId: string }) {
  return (
    <form action={withdrawSubmissionAction}>
      <input type="hidden" name="submissionId" value={submissionId} />

      <Button type="submit" variant="ghost" size="sm">
        Withdraw and resubmit
      </Button>
    </form>
  );
}

export function SubmissionForm({
  assignmentId,
  attemptsUsed,
  maxAttempts,
  deadlinePassed,
}: {
  assignmentId: string;
  attemptsUsed: number;
  maxAttempts: number;
  deadlinePassed: boolean;
}) {
  const [state, action, pending] = useActionState(submitAssessmentAction, initialState);

  if (deadlinePassed) {
    return <Alert tone="danger">The deadline has passed. Contact an administrator.</Alert>;
  }

  if (attemptsUsed >= maxAttempts) {
    return (
      <Alert tone="warning">You have used all {maxAttempts} attempt(s) for this assessment.</Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <p className="text-sm text-muted">
        Attempt {attemptsUsed + 1} of {maxAttempts}. Provide at least one link so the reviewer can
        see your work.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="GitHub repository"
          name="githubUrl"
          type="url"
          disabled={pending}
          placeholder="https://github.com/you/project"
          error={state.errors?.githubUrl?.[0]}
        />

        <TextField
          label="Live deployment"
          name="liveUrl"
          type="url"
          disabled={pending}
          placeholder="https://your-project.vercel.app"
          error={state.errors?.liveUrl?.[0]}
        />

        <TextField
          label="Figma file"
          name="figmaUrl"
          type="url"
          disabled={pending}
          placeholder="https://figma.com/file/..."
          error={state.errors?.figmaUrl?.[0]}
        />

        <TextField
          label="Documentation"
          name="documentUrl"
          type="url"
          disabled={pending}
          placeholder="https://docs.example.com"
          error={state.errors?.documentUrl?.[0]}
        />
      </div>

      <TextAreaField
        label="Notes for the reviewer"
        name="notes"
        rows={4}
        disabled={pending}
        placeholder="Anything the reviewer should know: trade-offs, known gaps, how to run it."
        error={state.errors?.notes?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Submit work" pendingLabel="Submitting..." />
    </form>
  );
}
