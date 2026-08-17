"use client";

import { useActionState } from "react";

import { FormStatus, SubmitButton, TextField } from "@/components/ui";

import {
  changePasswordAction,
  updateAccountAction,
  type AccountActionState,
} from "../actions/account.actions";

const initialState: AccountActionState = {};

export function AccountDetailsForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateAccountAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField
        label="Display name"
        name="name"
        required
        disabled={pending}
        defaultValue={name}
        hint="Shown wherever you appear across the platform."
        error={state.errors?.name?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Save changes" pendingLabel="Saving..." />
    </form>
  );
}

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <TextField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        disabled={pending}
        error={state.errors?.currentPassword?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={pending}
          hint="8+ characters, with upper, lower and a number."
          error={state.errors?.newPassword?.[0]}
        />

        <TextField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={pending}
          error={state.errors?.confirmPassword?.[0]}
        />
      </div>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton
        pending={pending}
        idleLabel="Change password"
        pendingLabel="Changing..."
        variant="secondary"
      />
    </form>
  );
}
