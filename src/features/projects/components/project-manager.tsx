"use client";

import { useActionState, useState } from "react";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormStatus,
  SubmitButton,
  TextAreaField,
  ImageUploadField,
  TextField,
} from "@/components/ui";

import {
  deleteProjectAction,
  requestProjectVerificationAction,
  saveProjectAction,
  type ProjectActionState,
} from "../actions/project.actions";
import type { ProjectWithSkills } from "../projects";

const initialState: ProjectActionState = {};

export function ProjectForm({
  project,
  skillOptions,
  onDone,
}: {
  project?: ProjectWithSkills;
  skillOptions: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveProjectAction, initialState);

  const selected = new Set(project?.skillNames ?? []);

  return (
    <form action={action} className="space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}

      <TextField
        label="Project name"
        name="title"
        required
        disabled={pending}
        defaultValue={project?.title ?? ""}
        placeholder="Realtime analytics dashboard"
        error={state.errors?.title?.[0]}
      />

      <TextAreaField
        label="Description"
        name="description"
        required
        rows={4}
        disabled={pending}
        defaultValue={project?.description ?? ""}
        placeholder="What it does, what you built, and any notable trade-offs."
        error={state.errors?.description?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Repository"
          name="githubUrl"
          type="url"
          disabled={pending}
          defaultValue={project?.githubUrl ?? ""}
          placeholder="https://github.com/you/project"
          error={state.errors?.githubUrl?.[0]}
        />

        <TextField
          label="Live demo"
          name="liveUrl"
          type="url"
          disabled={pending}
          defaultValue={project?.liveUrl ?? ""}
          error={state.errors?.liveUrl?.[0]}
        />

        <TextField
          label="Figma file"
          name="figmaUrl"
          type="url"
          disabled={pending}
          defaultValue={project?.figmaUrl ?? ""}
          error={state.errors?.figmaUrl?.[0]}
        />

        <ImageUploadField
          label="Cover image"
          name="coverImageUrl"
          purpose="project-image"
          disabled={pending}
          defaultValue={project?.coverImageUrl ?? ""}
          hint="Paste a link, or upload an image if storage is enabled."
          error={state.errors?.coverImageUrl?.[0]}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Technologies used</legend>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {skillOptions.map((skill) => (
            <label key={skill.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="skillIds"
                value={skill.id}
                defaultChecked={selected.has(skill.name)}
                disabled={pending}
                className="h-4 w-4 rounded border-line accent-current"
              />

              {skill.name}
            </label>
          ))}
        </div>
      </fieldset>

      <FormStatus success={state.success} message={state.message} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          pending={pending}
          idleLabel={project ? "Save changes" : "Add project"}
          pendingLabel="Saving..."
        />

        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ProjectList({
  projects,
  skillOptions,
}: {
  projects: ProjectWithSkills[];
  skillOptions: { id: string; name: string }[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Add the work you are proudest of. Verified projects carry more weight with recruiters."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {projects.map((project) => (
        <li key={project.id}>
          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{project.title}</p>

                  <StatusBadge kind="project" status={project.verificationStatus} />
                </div>

                <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{project.description}</p>

                {project.skillNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.skillNames.map((name) => (
                      <Badge key={name} tone="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="-mx-1.5 inline-flex min-h-11 items-center rounded-md px-1.5 underline"
                    >
                      Repository
                    </a>
                  )}

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="-mx-1.5 inline-flex min-h-11 items-center rounded-md px-1.5 underline"
                    >
                      Live demo
                    </a>
                  )}

                  {project.figmaUrl && (
                    <a
                      href={project.figmaUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="-mx-1.5 inline-flex min-h-11 items-center rounded-md px-1.5 underline"
                    >
                      Figma
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingId(editingId === project.id ? null : project.id)}
                >
                  {editingId === project.id ? "Close" : "Edit"}
                </Button>

                <VerificationButton project={project} />

                <form action={deleteProjectAction}>
                  <input type="hidden" name="id" value={project.id} />

                  <Button type="submit" size="sm" variant="ghost">
                    Delete
                  </Button>
                </form>
              </div>
            </div>

            {editingId === project.id && (
              <div className="border-t border-line pt-4">
                <ProjectForm
                  project={project}
                  skillOptions={skillOptions}
                  onDone={() => setEditingId(null)}
                />
              </div>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function VerificationButton({ project }: { project: ProjectWithSkills }) {
  const [state, action, pending] = useActionState(requestProjectVerificationAction, initialState);

  const canRequest = ["UNVERIFIED", "REJECTED"].includes(project.verificationStatus);

  if (!canRequest) {
    return null;
  }

  return (
    <form action={action}>
      <input type="hidden" name="id" value={project.id} />

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending..." : "Request verification"}
      </Button>

      {state.message && !state.success && (
        <p className="mt-1 max-w-xs text-xs text-danger">{state.message}</p>
      )}
    </form>
  );
}
