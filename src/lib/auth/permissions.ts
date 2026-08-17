export const APP_ROLES = {
  CANDIDATE: "CANDIDATE",
  REVIEWER: "REVIEWER",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function hasRole(roles: string[] | undefined, requiredRole: AppRole): boolean {
  return roles?.includes(requiredRole) ?? false;
}

export function hasAnyRole(roles: string[] | undefined, allowedRoles: AppRole[]): boolean {
  if (!roles?.length) {
    return false;
  }

  return allowedRoles.some((role) => roles.includes(role));
}

export function hasAllRoles(roles: string[] | undefined, requiredRoles: AppRole[]): boolean {
  if (!roles?.length) {
    return false;
  }

  return requiredRoles.every((role) => roles.includes(role));
}

export function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, APP_ROLES.ADMIN);
}
