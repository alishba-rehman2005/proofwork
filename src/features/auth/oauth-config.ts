/**
 * Which social sign-in providers actually have credentials.
 *
 * The buttons used to render permanently disabled when no provider was
 * configured, which reads as a broken feature rather than an absent one. The
 * pages use `any` to hide the whole block instead.
 */
export function isOAuthConfigured() {
  const google = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const github = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

  return { google, github, any: google || github };
}
