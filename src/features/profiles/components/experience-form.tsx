"use client";

import { useActionState } from "react";

import type { ExperienceItem } from "../types";
import {
  deleteExperienceAction,
  saveExperienceAction,
  type ProfileActionState,
} from "../actions/profile.actions";
import { CheckboxField, FormStatus, SubmitButton, TextAreaField, TextField } from "./form-fields";

type ExperienceFormProps = {
  item?: ExperienceItem;
};

const initialState: ProfileActionState = {};

export function ExperienceForm({ item }: ExperienceFormProps) {
  const [state, action, pending] = useActionState(saveExperienceAction, initialState);

  const isEditing = Boolean(item);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-line p-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Company"
          name="company"
          defaultValue={item?.company ?? ""}
          placeholder="Example Inc."
          error={state.errors?.company?.[0]}
          disabled={pending}
          required
        />

        <TextField
          label="Job title"
          name="jobTitle"
          defaultValue={item?.jobTitle ?? ""}
          placeholder="Frontend Engineer"
          error={state.errors?.jobTitle?.[0]}
          disabled={pending}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Employment type"
          name="employmentType"
          defaultValue={item?.employmentType ?? ""}
          placeholder="Full-time"
          error={state.errors?.employmentType?.[0]}
          disabled={pending}
        />

        <TextField
          label="Location"
          name="location"
          defaultValue={item?.location ?? ""}
          placeholder="Remote"
          error={state.errors?.location?.[0]}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={item?.startDate ?? ""}
          error={state.errors?.startDate?.[0]}
          disabled={pending}
          required
        />

        <TextField
          label="End date"
          name="endDate"
          type="date"
          defaultValue={item?.endDate ?? ""}
          error={state.errors?.endDate?.[0]}
          disabled={pending}
        />
      </div>

      <CheckboxField
        label="I currently work here"
        name="currentlyWorking"
        defaultChecked={item?.currentlyWorking ?? false}
        disabled={pending}
      />

      <TextAreaField
        label="Description"
        name="description"
        defaultValue={item?.description ?? ""}
        error={state.errors?.description?.[0]}
        disabled={pending}
      />

      <FormStatus success={state.success} message={state.message} />

      <div className="flex items-center gap-3">
        <SubmitButton
          pending={pending}
          idleLabel={isEditing ? "Update experience" : "Add experience"}
          pendingLabel="Saving..."
        />

        {item && (
          <button
            type="submit"
            formAction={deleteExperienceAction}
            formNoValidate
            disabled={pending}
            className="rounded-lg border border-danger/40 px-4 py-2.5 font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
