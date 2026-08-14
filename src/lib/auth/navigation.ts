import { APP_ROLES, type AppRole } from "@/lib/auth/permissions";

export type NavItem = {
  label: string;
  href: string;
  /** Roles allowed to see the item. Empty means every signed-in user. */
  roles: AppRole[];
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

/**
 * Sidebar navigation, filtered by role at render time.
 *
 * Sections for features that are not built yet are deliberately absent rather
 * than shown disabled, so the sidebar never advertises a dead link.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", roles: [] }],
  },
  {
    heading: "Candidate",
    items: [
      { label: "My profile", href: "/profile", roles: [APP_ROLES.CANDIDATE] },
      { label: "Edit profile", href: "/profile/edit", roles: [APP_ROLES.CANDIDATE] },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Reviewer", href: "/reviewer", roles: [APP_ROLES.REVIEWER] },
      { label: "Recruiter", href: "/recruiter", roles: [APP_ROLES.RECRUITER] },
      { label: "Admin", href: "/admin", roles: [APP_ROLES.ADMIN] },
    ],
  },
];

export function getNavSections(roles: string[]): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.roles.length === 0 || item.roles.some((role) => roles.includes(role)),
    ),
  })).filter((section) => section.items.length > 0);
}

/**
 * True when `href` should be highlighted for the current path.
 *
 * Exact match only, so /profile does not stay active while on /profile/edit.
 */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href;
}
