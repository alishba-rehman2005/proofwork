"use client";

import { useActionState } from "react";

import { Badge, Button, FormStatus, SubmitButton, TextAreaField, TextField } from "@/components/ui";

import {
  inviteColleagueAction,
  removeColleagueAction,
  updateCompanyAction,
  type CompanyActionState,
} from "../actions/company.actions";
import type { CompanyDetails } from "../company";

const initialState: CompanyActionState = {};

export function CompanyDetailsForm({ company }: { company: CompanyDetails }) {
  const [state, action, pending] = useActionState(updateCompanyAction, initialState);

  if (!company.isOwner) {
    return (
      <p className="text-sm text-muted">
        Only the company owner can edit these details. Ask them to make changes.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Company name"
          name="name"
          required
          disabled={pending}
          defaultValue={company.name}
          error={state.errors?.name?.[0]}
        />

        <TextField
          label="Industry"
          name="industry"
          disabled={pending}
          defaultValue={company.industry ?? ""}
          placeholder="Software"
          error={state.errors?.industry?.[0]}
        />

        <TextField
          label="Website"
          name="website"
          type="url"
          disabled={pending}
          defaultValue={company.website ?? ""}
          placeholder="https://company.com"
          error={state.errors?.website?.[0]}
        />

        <TextField
          label="Location"
          name="location"
          disabled={pending}
          defaultValue={company.location ?? ""}
          placeholder="Lahore, Pakistan"
          error={state.errors?.location?.[0]}
        />
      </div>

      <TextField
        label="Logo URL"
        name="logoUrl"
        type="url"
        disabled={pending}
        defaultValue={company.logoUrl ?? ""}
        hint="A direct link to an image. File upload is not enabled yet."
        error={state.errors?.logoUrl?.[0]}
      />

      <TextAreaField
        label="About the company"
        name="description"
        rows={4}
        disabled={pending}
        defaultValue={company.description ?? ""}
        placeholder="What you build, and who you are hiring."
        error={state.errors?.description?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Save company" pendingLabel="Saving..." />
    </form>
  );
}

export function CompanyTeam({ company }: { company: CompanyDetails }) {
  const [state, action, pending] = useActionState(inviteColleagueAction, initialState);

  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {company.members.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{member.name ?? member.email}</p>

                <Badge tone={member.membershipRole === "OWNER" ? "success" : "accent"}>
                  {member.membershipRole.toLowerCase()}
                </Badge>

                {member.isMe && <Badge tone="neutral">You</Badge>}
              </div>

              <p className="mt-1 text-xs text-muted">
                {member.email}
                {member.jobTitle ? ` · ${member.jobTitle}` : ""}
              </p>
            </div>

            {company.isOwner && member.membershipRole !== "OWNER" && (
              <form action={removeColleagueAction}>
                <input type="hidden" name="memberId" value={member.id} />

                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {company.isOwner && (
        <form action={action} className="space-y-3 border-t border-line pt-4">
          <p className="text-sm font-medium">Add a colleague</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              disabled={pending}
              placeholder="colleague@company.com"
              hint="They must already have a ProofWork account."
              error={state.errors?.email?.[0]}
            />

            <TextField
              label="Job title"
              name="jobTitle"
              disabled={pending}
              placeholder="Talent Partner"
              error={state.errors?.jobTitle?.[0]}
            />
          </div>

          <FormStatus success={state.success} message={state.message} />

          <SubmitButton
            pending={pending}
            idleLabel="Add colleague"
            pendingLabel="Adding..."
            variant="secondary"
          />
        </form>
      )}
    </div>
  );
}
