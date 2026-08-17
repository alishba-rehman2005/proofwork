import { APP_ROLES, type AppRole } from "@/lib/auth/permissions";

export type Workspace = {
  role: AppRole;
  label: string;
  href: string;
};

const WORKSPACE_MAP: Record<AppRole, Workspace> = {
  CANDIDATE: {
    role: APP_ROLES.CANDIDATE,
    label: "Candidate",
    href: "/dashboard",
  },

  REVIEWER: {
    role: APP_ROLES.REVIEWER,
    label: "Reviewer",
    href: "/reviewer",
  },

  RECRUITER: {
    role: APP_ROLES.RECRUITER,
    label: "Recruiter",
    href: "/recruiter",
  },

  ADMIN: {
    role: APP_ROLES.ADMIN,
    label: "Admin",
    href: "/admin",
  },
};

export function getAvailableWorkspaces(roles: string[]): Workspace[] {
  return roles
    .filter((role): role is AppRole => role in WORKSPACE_MAP)
    .map((role) => WORKSPACE_MAP[role]);
}

export function getPrimaryWorkspace(primaryRole: string | null, roles: string[]): Workspace {
  if (primaryRole && primaryRole in WORKSPACE_MAP) {
    return WORKSPACE_MAP[primaryRole as AppRole];
  }

  const firstRole = roles.find((role): role is AppRole => role in WORKSPACE_MAP);

  return firstRole ? WORKSPACE_MAP[firstRole] : WORKSPACE_MAP.CANDIDATE;
}
