/** Length of the id fragment appended to a slug to keep it unique. */
const ID_SUFFIX_LENGTH = 8;

const FALLBACK_SLUG = "candidate";

/**
 * Converts a display name into a URL-safe slug fragment.
 *
 * Accents are folded to their base letters so "Zoë" becomes "zoe" rather than
 * losing the character entirely. Returns a fallback when the name contains no
 * alphanumeric characters at all.
 */
export function slugifyName(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || FALLBACK_SLUG;
}

/**
 * Builds the public profile slug.
 *
 * The id fragment keeps slugs unique across candidates who share a name, and
 * matches the backfill used in migration 0005.
 */
export function buildProfileSlug(fullName: string, profileId: string): string {
  const suffix = profileId.replace(/-/g, "").slice(0, ID_SUFFIX_LENGTH);

  return `${slugifyName(fullName)}-${suffix}`;
}
