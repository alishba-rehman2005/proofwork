"use client";

import { useActionState } from "react";

import type { SocialLinkItem } from "../types";
import { SOCIAL_PLATFORM_OPTIONS } from "../constants";
import {
  deleteSocialLinkAction,
  saveSocialLinkAction,
  type ProfileActionState,
} from "../actions/profile.actions";
import { FormStatus, SelectField, SubmitButton, TextField } from "@/components/ui";

type SocialLinkFormProps = {
  item?: SocialLinkItem;
};

const initialState: ProfileActionState = {};

export function SocialLinkForm({ item }: SocialLinkFormProps) {
  const [state, action, pending] = useActionState(saveSocialLinkAction, initialState);

  const isEditing = Boolean(item);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-line p-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Platform"
          name="platform"
          options={[...SOCIAL_PLATFORM_OPTIONS]}
          defaultValue={item?.platform ?? "LINKEDIN"}
          error={state.errors?.platform?.[0]}
          disabled={pending}
        />

        <TextField
          label="Label"
          name="label"
          defaultValue={item?.label ?? ""}
          placeholder="Optional display name"
          error={state.errors?.label?.[0]}
          disabled={pending}
        />
      </div>

      <TextField
        label="URL"
        name="url"
        type="url"
        defaultValue={item?.url ?? ""}
        placeholder="https://example.com/your-profile"
        error={state.errors?.url?.[0]}
        disabled={pending}
        required
      />

      <FormStatus success={state.success} message={state.message} />

      <div className="flex items-center gap-3">
        <SubmitButton
          pending={pending}
          idleLabel={isEditing ? "Update link" : "Add link"}
          pendingLabel="Saving..."
        />

        {item && (
          <button
            type="submit"
            formAction={deleteSocialLinkAction}
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
