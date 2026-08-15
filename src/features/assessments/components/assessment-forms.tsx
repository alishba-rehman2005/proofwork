"use client";

import { useActionState } from "react";

import {
  Button,
  FormStatus,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  controlClassName,
} from "@/components/ui";

import {
  addResourceAction,
  addRubricCriterionAction,
  archiveAssessmentAction,
  assignAssessmentAction,
  createAssessmentAction,
  deleteResourceAction,
  deleteRubricCriterionAction,
  publishAssessmentAction,
  type AssessmentActionState,
} from "../actions/assessment.actions";
import { DIFFICULTY_OPTIONS } from "../validation/assessment.schema";

const initialState: AssessmentActionState = {};

export function CreateAssessmentForm({
  skillOptions,
}: {
  skillOptions: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAssessmentAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField
        label="Title"
        name="title"
        required
        disabled={pending}
        placeholder="React.js — responsive product dashboard"
        error={state.errors?.title?.[0]}
      />

      <TextAreaField
        label="Description"
        name="description"
        required
        rows={4}
        disabled={pending}
        placeholder="What the candidate is being asked to build and why."
        error={state.errors?.description?.[0]}
      />

      <TextAreaField
        label="Requirements"
        name="requirements"
        required
        rows={5}
        disabled={pending}
        placeholder="Bullet the functional and technical requirements."
        error={state.errors?.requirements?.[0]}
      />

      <TextAreaField
        label="Submission instructions"
        name="submissionInstructions"
        required
        rows={3}
        disabled={pending}
        placeholder="What to send: repository, live URL, Figma file, documentation."
        error={state.errors?.submissionInstructions?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Difficulty"
          name="difficulty"
          defaultValue="INTERMEDIATE"
          disabled={pending}
          options={[...DIFFICULTY_OPTIONS]}
        />

        <TextField
          label="Estimated duration (minutes)"
          name="estimatedDurationMinutes"
          type="number"
          min={5}
          disabled={pending}
          placeholder="240"
          error={state.errors?.estimatedDurationMinutes?.[0]}
        />

        <TextField
          label="Maximum score"
          name="maximumScore"
          type="number"
          defaultValue={100}
          min={10}
          required
          disabled={pending}
          error={state.errors?.maximumScore?.[0]}
        />

        <TextField
          label="Passing score"
          name="passingScore"
          type="number"
          defaultValue={70}
          min={1}
          required
          disabled={pending}
          error={state.errors?.passingScore?.[0]}
        />

        <TextField
          label="Maximum attempts"
          name="maxAttempts"
          type="number"
          defaultValue={2}
          min={1}
          max={10}
          required
          disabled={pending}
          error={state.errors?.maxAttempts?.[0]}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Skills this verifies</legend>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {skillOptions.map((skill) => (
            <label key={skill.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="skillIds"
                value={skill.id}
                disabled={pending}
                className="h-4 w-4 rounded border-line accent-current"
              />

              {skill.name}
            </label>
          ))}
        </div>

        {state.errors?.skillIds?.[0] && (
          <p className="mt-1 text-sm text-danger">{state.errors.skillIds[0]}</p>
        )}
      </fieldset>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Create draft" pendingLabel="Creating..." />
    </form>
  );
}

export function RubricCriterionForm({ assessmentId }: { assessmentId: string }) {
  const [state, action, pending] = useActionState(addRubricCriterionAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="assessmentId" value={assessmentId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Criterion"
          name="name"
          required
          disabled={pending}
          placeholder="Code quality"
          error={state.errors?.name?.[0]}
        />

        <TextField
          label="Maximum points"
          name="maximumPoints"
          type="number"
          min={1}
          defaultValue={10}
          required
          disabled={pending}
          error={state.errors?.maximumPoints?.[0]}
        />

        <TextField
          label="Weight (%)"
          name="weight"
          type="number"
          min={0}
          max={100}
          defaultValue={25}
          required
          disabled={pending}
          hint="Relative importance. Weights are normalised, so they need not total 100."
          error={state.errors?.weight?.[0]}
        />
      </div>

      <TextAreaField
        label="What the reviewer should look for"
        name="description"
        rows={2}
        disabled={pending}
        error={state.errors?.description?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton
        pending={pending}
        idleLabel="Add criterion"
        pendingLabel="Adding..."
        variant="secondary"
      />
    </form>
  );
}

export function DeleteCriterionButton({
  criterionId,
  assessmentId,
}: {
  criterionId: string;
  assessmentId: string;
}) {
  return (
    <form action={deleteRubricCriterionAction}>
      <input type="hidden" name="criterionId" value={criterionId} />
      <input type="hidden" name="assessmentId" value={assessmentId} />

      <Button type="submit" variant="ghost" size="sm">
        Remove
      </Button>
    </form>
  );
}

export function ResourceForm({ assessmentId }: { assessmentId: string }) {
  const [state, action, pending] = useActionState(addResourceAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="assessmentId" value={assessmentId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Title"
          name="title"
          required
          disabled={pending}
          placeholder="API reference"
          error={state.errors?.title?.[0]}
        />

        <TextField
          label="URL"
          name="url"
          type="url"
          required
          disabled={pending}
          placeholder="https://..."
          error={state.errors?.url?.[0]}
        />

        <TextField
          label="Type"
          name="resourceType"
          disabled={pending}
          placeholder="Documentation"
          error={state.errors?.resourceType?.[0]}
        />
      </div>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton
        pending={pending}
        idleLabel="Add resource"
        pendingLabel="Adding..."
        variant="secondary"
      />
    </form>
  );
}

export function DeleteResourceButton({
  resourceId,
  assessmentId,
}: {
  resourceId: string;
  assessmentId: string;
}) {
  return (
    <form action={deleteResourceAction}>
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="assessmentId" value={assessmentId} />

      <Button type="submit" variant="ghost" size="sm">
        Remove
      </Button>
    </form>
  );
}

export function PublishControls({
  assessmentId,
  status,
}: {
  assessmentId: string;
  status: string;
}) {
  const [publishState, publish, publishing] = useActionState(publishAssessmentAction, initialState);
  const [archiveState, archive, archiving] = useActionState(archiveAssessmentAction, initialState);

  const message = publishState.message ?? archiveState.message;
  const success = publishState.success ?? archiveState.success;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" && (
          <form action={publish}>
            <input type="hidden" name="assessmentId" value={assessmentId} />

            <Button type="submit" disabled={publishing}>
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </form>
        )}

        {status !== "ARCHIVED" && (
          <form action={archive}>
            <input type="hidden" name="assessmentId" value={assessmentId} />

            <Button type="submit" variant="secondary" disabled={archiving}>
              {archiving ? "Archiving..." : "Archive"}
            </Button>
          </form>
        )}
      </div>

      <FormStatus success={success} message={message} />
    </div>
  );
}

export function AssignAssessmentForm({
  requestId,
  assessments,
  reviewers,
}: {
  requestId: string;
  assessments: { id: string; title: string; difficulty: string }[];
  reviewers: { id: string; email: string }[];
}) {
  const [state, action, pending] = useActionState(assignAssessmentAction, initialState);

  if (assessments.length === 0) {
    return (
      <p className="text-sm text-danger">
        No published assessment covers this skill yet. Create and publish one first.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="verificationRequestId" value={requestId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Assessment"
          name="assessmentId"
          disabled={pending}
          options={assessments.map((item) => ({
            value: item.id,
            label: `${item.title} (${item.difficulty.toLowerCase()})`,
          }))}
          error={state.errors?.assessmentId?.[0]}
        />

        <SelectField
          label="Reviewer"
          name="reviewerId"
          disabled={pending}
          options={[
            { value: "", label: "Any available reviewer" },
            ...reviewers.map((reviewer) => ({ value: reviewer.id, label: reviewer.email })),
          ]}
          error={state.errors?.reviewerId?.[0]}
        />

        <div>
          <label htmlFor={`deadline-${requestId}`} className="text-sm font-medium">
            Deadline
          </label>

          <input
            id={`deadline-${requestId}`}
            name="deadline"
            type="date"
            required
            disabled={pending}
            className={`${controlClassName} mt-2`}
          />

          {state.errors?.deadline?.[0] && (
            <p className="mt-1 text-sm text-danger">{state.errors.deadline[0]}</p>
          )}
        </div>
      </div>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Assign" pendingLabel="Assigning..." />
    </form>
  );
}
