export const APP_ROLES = {
  CANDIDATE: "CANDIDATE",
  REVIEWER: "REVIEWER",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function hasRole(roles: string[] | undefined, role: AppRole): boolean {
  return roles?.includes(role) ?? false;
}

export function hasAnyRole(roles: string[] | undefined, allowedRoles: AppRole[]): boolean {
  if (!roles) {
    return false;
  }

  return allowedRoles.some((role) => roles.includes(role));
}
