"use client";

import { useActionState } from "react";

import type { EducationItem } from "../types";
import {
  deleteEducationAction,
  saveEducationAction,
  type ProfileActionState,
} from "../actions/profile.actions";
import { CheckboxField, FormStatus, SubmitButton, TextAreaField, TextField } from "./form-fields";

type EducationFormProps = {
  item?: EducationItem;
};

const initialState: ProfileActionState = {};

export function EducationForm({ item }: EducationFormProps) {
  const [state, action, pending] = useActionState(saveEducationAction, initialState);

  const isEditing = Boolean(item);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 p-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <TextField
        label="Institution"
        name="institution"
        defaultValue={item?.institution ?? ""}
        placeholder="University of Example"
        error={state.errors?.institution?.[0]}
        disabled={pending}
        required
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Degree"
          name="degree"
          defaultValue={item?.degree ?? ""}
          placeholder="BSc"
          error={state.errors?.degree?.[0]}
          disabled={pending}
        />

        <TextField
          label="Field of study"
          name="fieldOfStudy"
          defaultValue={item?.fieldOfStudy ?? ""}
          placeholder="Computer Science"
          error={state.errors?.fieldOfStudy?.[0]}
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
        label="I currently study here"
        name="currentlyStudying"
        defaultChecked={item?.currentlyStudying ?? false}
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
          idleLabel={isEditing ? "Update education" : "Add education"}
          pendingLabel="Saving..."
        />

        {item && (
          <button
            type="submit"
            formAction={deleteEducationAction}
            formNoValidate
            disabled={pending}
            className="rounded-lg border border-red-200 px-4 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
