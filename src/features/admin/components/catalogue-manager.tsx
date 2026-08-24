"use client";

import { useActionState } from "react";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  Button,
  EmptyState,
  FormStatus,
  SelectField,
  SubmitButton,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TextField,
} from "@/components/ui";

import {
  createSkillAction,
  decideSkillRequestAction,
  setAccountStatusAction,
  toggleSkillAction,
  type CatalogueActionState,
} from "../actions/catalogue.actions";
import type { ManagedUser, SkillRequestRow } from "../server/admin.queries";
import { formatDate } from "@/lib/format";

const initialState: CatalogueActionState = {};

export function SkillCatalogue({
  skills,
  categories,
}: {
  skills: { id: string; name: string; isActive: boolean; claimedBy: number }[];
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createSkillAction, initialState);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField
            label="New skill"
            name="name"
            required
            disabled={pending}
            placeholder="Rust"
            error={state.errors?.name?.[0]}
          />

          <SelectField
            label="Category"
            name="categoryId"
            disabled={pending}
            options={[
              { value: "", label: "Uncategorised" },
              ...categories.map((category) => ({ value: category.id, label: category.name })),
            ]}
            error={state.errors?.categoryId?.[0]}
          />

          <div className="flex items-end">
            <SubmitButton pending={pending} idleLabel="Add skill" pendingLabel="Adding..." />
          </div>
        </div>

        <FormStatus success={state.success} message={state.message} />
      </form>

      <Table>
        <THead>
          <TR>
            <TH>Skill</TH>
            <TH>Status</TH>
            <TH className="text-right">Claimed by</TH>
            <TH className="text-right">Action</TH>
          </TR>
        </THead>

        <TBody>
          {skills.map((skill) => (
            <TR key={skill.id}>
              <TD className="font-medium">{skill.name}</TD>

              <TD>
                <Badge tone={skill.isActive ? "solid" : "neutral"}>
                  {skill.isActive ? "Active" : "Retired"}
                </Badge>
              </TD>

              <TD className="tabular text-right">{skill.claimedBy}</TD>

              <TD>
                <div className="flex justify-end">
                  <form action={toggleSkillAction}>
                    <input type="hidden" name="skillId" value={skill.id} />

                    <Button type="submit" size="sm" variant="ghost">
                      {skill.isActive ? "Retire" : "Restore"}
                    </Button>
                  </form>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

export function SkillRequests({ requests }: { requests: SkillRequestRow[] }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No skill suggestions"
        description="Candidate suggestions for missing skills will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4"
        >
          <div className="min-w-0">
            <p className="font-medium">{request.proposedName}</p>

            {request.description && (
              <p className="mt-1 text-sm text-muted">{request.description}</p>
            )}

            <p className="mt-1 text-xs text-muted">
              Suggested by {request.requestedBy} · {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <form action={decideSkillRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="decision" value="approve" />

              <Button type="submit" size="sm">
                Add to catalogue
              </Button>
            </form>

            <form action={decideSkillRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="decision" value="reject" />

              <Button type="submit" size="sm" variant="ghost">
                Decline
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function UserTable({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Account</TH>
          <TH>Roles</TH>
          <TH>Status</TH>
          <TH className="text-right">Action</TH>
        </TR>
      </THead>

      <TBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;

          return (
            <TR key={user.id}>
              <TD>
                <p className="font-medium">{user.email}</p>

                <p className="text-xs text-muted">Joined {formatDate(user.createdAt)}</p>
              </TD>

              <TD>
                <div className="flex flex-wrap gap-1">
                  {user.roleNames.map((role) => (
                    <Badge key={role} tone="outline">
                      {role.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </TD>

              <TD>
                <Badge
                  tone={
                    user.accountStatus === "ACTIVE"
                      ? "solid"
                      : user.accountStatus === "PENDING"
                        ? "warning"
                        : "danger"
                  }
                >
                  {user.accountStatus.toLowerCase()}
                </Badge>
              </TD>

              <TD>
                <div className="flex justify-end gap-2">
                  {isSelf ? (
                    <span className="text-xs text-muted">Your account</span>
                  ) : user.accountStatus === "ACTIVE" ? (
                    <form action={setAccountStatusAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="status" value="SUSPENDED" />

                      <Button type="submit" size="sm" variant="ghost">
                        Suspend
                      </Button>
                    </form>
                  ) : (
                    <form action={setAccountStatusAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="status" value="ACTIVE" />

                      <Button type="submit" size="sm" variant="ghost">
                        Activate
                      </Button>
                    </form>
                  )}
                </div>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

export function ProjectVerificationQueue({
  projects,
  onDecide,
}: {
  projects: {
    id: string;
    title: string;
    githubUrl: string | null;
    liveUrl: string | null;
  }[];
  onDecide: (formData: FormData) => Promise<void>;
}) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects awaiting verification"
        description="Projects submitted by candidates will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{project.title}</p>

              <StatusBadge kind="project" status="UNDER_REVIEW" />
            </div>

            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline"
                >
                  Repository
                </a>
              )}

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline"
                >
                  Live demo
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <form action={onDecide}>
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="decision" value="approve" />

              <Button type="submit" size="sm">
                Verify
              </Button>
            </form>

            <form action={onDecide}>
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="decision" value="reject" />

              <Button type="submit" size="sm" variant="ghost">
                Reject
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
