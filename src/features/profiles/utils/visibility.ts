import { APP_ROLES } from "@/lib/auth/permissions";

export type ProfileVisibility = "PRIVATE" | "RECRUITERS_ONLY" | "PUBLIC";

export type ProfileViewer = {
  /** Null when the visitor is signed out. */
  userId: string | null;
  roles: string[];
};

export type VisibilityTarget = {
  /** The user who owns the profile, not the profile's own id. */
  userId: string;
  profileVisibility: ProfileVisibility;
};

export const ANONYMOUS_VIEWER: ProfileViewer = { userId: null, roles: [] };

/**
 * Decides whether a viewer may see a candidate profile.
 *
 * Owners and admins always can. Otherwise the profile's own visibility setting
 * governs: PUBLIC is open to signed-out visitors, RECRUITERS_ONLY requires the
 * recruiter role, and PRIVATE is owner-only.
 */
export function canViewProfile(target: VisibilityTarget, viewer: ProfileViewer): boolean {
  if (viewer.userId && viewer.userId === target.userId) {
    return true;
  }

  if (viewer.roles.includes(APP_ROLES.ADMIN)) {
    return true;
  }

  switch (target.profileVisibility) {
    case "PUBLIC":
      return true;

    case "RECRUITERS_ONLY":
      return viewer.roles.includes(APP_ROLES.RECRUITER);

    case "PRIVATE":
      return false;
  }
}

/** Human-readable description of who can currently see the profile. */
export function describeVisibility(visibility: ProfileVisibility): string {
  switch (visibility) {
    case "PUBLIC":
      return "Anyone with the link can view this profile.";

    case "RECRUITERS_ONLY":
      return "Only signed-in recruiters can view this profile.";

    case "PRIVATE":
      return "Only you can view this profile.";
  }
}
