"use client";

import { useActionState, useState } from "react";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
  FormStatus,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui";

import {
  addContributionAction,
  createTeamAction,
  deleteContributionAction,
  inviteMemberAction,
  removeMemberAction,
  respondToInvitationAction,
  type TeamActionState,
} from "../actions/team.actions";
import type { TeamRow } from "../teams";

const initialState: TeamActionState = {};

export function CreateTeamForm({ projects }: { projects: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createTeamAction, initialState);

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted">
        Every project already has a team. Add another project to start a new one.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Project"
          name="projectId"
          disabled={pending}
          options={projects.map((project) => ({ value: project.id, label: project.title }))}
          error={state.errors?.projectId?.[0]}
        />

        <TextField
          label="Team name"
          name="name"
          required
          disabled={pending}
          placeholder="Dashboard squad"
          error={state.errors?.name?.[0]}
        />
      </div>

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton pending={pending} idleLabel="Create team" pendingLabel="Creating..." />
    </form>
  );
}

export function TeamList({ teams }: { teams: TeamRow[] }) {
  if (teams.length === 0) {
    return (
      <EmptyState
        title="No teams yet"
        description="Create a team on one of your projects, or wait to be invited to someone else's."
      />
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <TeamCard key={team.teamId} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamRow }) {
  const active = team.members.filter((member) => member.status === "ACTIVE");

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{team.name}</CardTitle>

            {team.isOwner && <Badge tone="solid">Owner</Badge>}
          </div>

          <p className="mt-1 text-sm text-muted">
            Project: {team.projectTitle} · {active.length} active member
            {active.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {team.members
          .filter((member) => member.status !== "REMOVED")
          .map((member) => (
            <li key={member.memberId} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{member.fullName ?? member.email}</p>

                    <Badge tone="outline">{member.projectRole}</Badge>

                    {member.status === "INVITED" && <Badge tone="warning">Invited</Badge>}

                    {member.isMe && <Badge tone="neutral">You</Badge>}
                  </div>

                  <p className="mt-1 text-xs text-muted">{member.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {member.isMe && member.status === "INVITED" && (
                    <>
                      <form action={respondToInvitationAction}>
                        <input type="hidden" name="memberId" value={member.memberId} />
                        <input type="hidden" name="response" value="accept" />

                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>

                      <form action={respondToInvitationAction}>
                        <input type="hidden" name="memberId" value={member.memberId} />
                        <input type="hidden" name="response" value="decline" />

                        <Button type="submit" size="sm" variant="ghost">
                          Decline
                        </Button>
                      </form>
                    </>
                  )}

                  {(team.isOwner || member.isMe) && !(team.isOwner && member.isMe) && (
                    <form action={removeMemberAction}>
                      <input type="hidden" name="memberId" value={member.memberId} />

                      <Button type="submit" size="sm" variant="ghost">
                        {member.isMe ? "Leave" : "Remove"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {member.contributions.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {member.contributions.map((contribution) => (
                    <li key={contribution.id} className="rounded-lg bg-surface-muted p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{contribution.title}</span>

                        <span className="flex items-center gap-2">
                          <StatusBadge kind="project" status={contribution.verificationStatus} />

                          {member.isMe && (
                            <form action={deleteContributionAction}>
                              <input type="hidden" name="contributionId" value={contribution.id} />

                              <Button type="submit" size="sm" variant="ghost">
                                Remove
                              </Button>
                            </form>
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-muted">{contribution.description}</p>

                      {contribution.evidenceUrl && (
                        <a
                          href={contribution.evidenceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-1 inline-block underline"
                        >
                          Evidence
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {member.isMe && member.status === "ACTIVE" && (
                <ContributionForm memberId={member.memberId} />
              )}
            </li>
          ))}
      </ul>

      {team.isOwner && <InviteForm teamId={team.teamId} />}
    </Card>
  );
}

function InviteForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState(inviteMemberAction, initialState);

  return (
    <form action={action} className="space-y-3 border-t border-line pt-4">
      <p className="text-sm font-medium">Invite a member</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          disabled={pending}
          placeholder="teammate@example.com"
          error={state.errors?.email?.[0]}
        />

        <TextField
          label="Role on this project"
          name="projectRole"
          required
          disabled={pending}
          placeholder="Backend developer"
          error={state.errors?.projectRole?.[0]}
        />
      </div>

      <input type="hidden" name="teamId" value={teamId} />

      <FormStatus success={state.success} message={state.message} />

      <SubmitButton
        pending={pending}
        idleLabel="Send invitation"
        pendingLabel="Sending..."
        variant="secondary"
      />
    </form>
  );
}

function ContributionForm({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addContributionAction, initialState);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="mt-3"
      >
        Log a contribution
      </Button>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-line pt-4">
      <input type="hidden" name="teamMemberId" value={memberId} />

      <TextField
        label="What did you do?"
        name="title"
        required
        disabled={pending}
        placeholder="Built the authentication flow"
        error={state.errors?.title?.[0]}
      />

      <TextAreaField
        label="Details"
        name="description"
        rows={3}
        required
        disabled={pending}
        placeholder="Describe your specific contribution so a reviewer can verify it."
        error={state.errors?.description?.[0]}
      />

      <TextField
        label="Evidence link"
        name="evidenceUrl"
        type="url"
        disabled={pending}
        placeholder="https://github.com/org/repo/pull/42"
        hint="A pull request or commit range. Required for verification."
        error={state.errors?.evidenceUrl?.[0]}
      />

      <FormStatus success={state.success} message={state.message} />

      <div className="flex gap-2">
        <SubmitButton pending={pending} idleLabel="Save" pendingLabel="Saving..." />

        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
