"use client";

import { useActionState } from "react";

import type { CandidateProfile } from "../types";
import { AVAILABILITY_OPTIONS, PROFILE_VISIBILITY_OPTIONS } from "../constants";
import { type ProfileActionState, updateProfileAction } from "../actions/profile.actions";
import { FormStatus, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui";

type ProfileFormProps = {
  profile: CandidateProfile;
};

const initialState: ProfileActionState = {};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <TextField
        label="Full name"
        name="fullName"
        defaultValue={profile.fullName}
        error={state.errors?.fullName?.[0]}
        disabled={pending}
        required
      />

      <TextField
        label="Professional headline"
        name="headline"
        defaultValue={profile.headline ?? ""}
        placeholder="Frontend Engineer focused on design systems"
        error={state.errors?.headline?.[0]}
        disabled={pending}
      />

      <TextAreaField
        label="Bio"
        name="bio"
        rows={5}
        defaultValue={profile.bio ?? ""}
        error={state.errors?.bio?.[0]}
        disabled={pending}
      />

      <TextField
        label="Location"
        name="location"
        defaultValue={profile.location ?? ""}
        error={state.errors?.location?.[0]}
        disabled={pending}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Country"
          name="country"
          defaultValue={profile.country ?? ""}
          error={state.errors?.country?.[0]}
          disabled={pending}
        />

        <TextField
          label="City"
          name="city"
          defaultValue={profile.city ?? ""}
          error={state.errors?.city?.[0]}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Availability"
          name="availability"
          options={[...AVAILABILITY_OPTIONS]}
          defaultValue={profile.availability ?? ""}
          error={state.errors?.availability?.[0]}
          disabled={pending}
        />

        <SelectField
          label="Profile visibility"
          name="profileVisibility"
          options={[...PROFILE_VISIBILITY_OPTIONS]}
          defaultValue={profile.profileVisibility}
          error={state.errors?.profileVisibility?.[0]}
          disabled={pending}
        />
      </div>

      <TextField
        label="GitHub URL"
        name="githubUrl"
        type="url"
        defaultValue={profile.githubUrl ?? ""}
        placeholder="https://github.com/username"
        error={state.errors?.githubUrl?.[0]}
        disabled={pending}
      />

      <TextField
        label="Portfolio URL"
        name="portfolioUrl"
        type="url"
        defaultValue={profile.portfolioUrl ?? ""}
        error={state.errors?.portfolioUrl?.[0]}
        disabled={pending}
      />

      <TextField
        label="Website URL"
        name="websiteUrl"
        type="url"
        defaultValue={profile.websiteUrl ?? ""}
        error={state.errors?.websiteUrl?.[0]}
        disabled={pending}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Save profile" pendingLabel="Saving..." />
    </form>
  );
}
