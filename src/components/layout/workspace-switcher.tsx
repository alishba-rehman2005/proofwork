"use client";

import { useRouter } from "next/navigation";

import type { Workspace } from "@/lib/auth/workspaces";

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  currentRole: string | null;
};

export function WorkspaceSwitcher({ workspaces, currentRole }: WorkspaceSwitcherProps) {
  const router = useRouter();

  if (workspaces.length <= 1) {
    return null;
  }

  return (
    <select
      value={currentRole ?? ""}
      onChange={(event) => {
        const selected = workspaces.find(
          (workspace) => workspace.role === event.target.value,
        );

        if (selected) {
          router.push(selected.href);
        }
      }}
      className="rounded-lg border px-3 py-2"
    >
      {workspaces.map((workspace) => (
        <option
          key={workspace.role}
          value={workspace.role}
        >
          {workspace.label}
        </option>
      ))}
    </select>
  );
}
