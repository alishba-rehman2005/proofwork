import { signInWithGitHub, signInWithGoogle } from "@/features/auth/actions/oauth";
import { GitHubIcon, GoogleIcon } from "@/features/auth/components/auth-icons";

type SocialAuthButtonsProps = {
  googleEnabled: boolean;
  githubEnabled: boolean;
  compact?: boolean;
};

const buttonClass =
  "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted";

/**
 * Renders only the providers that are configured.
 *
 * An unconfigured provider is omitted rather than disabled: a greyed-out
 * button invites a click that can never work.
 */
export function SocialAuthButtons({
  googleEnabled,
  githubEnabled,
  compact = false,
}: SocialAuthButtonsProps) {
  if (!googleEnabled && !githubEnabled) {
    return null;
  }

  const bothEnabled = googleEnabled && githubEnabled;

  return (
    <div className={compact && bothEnabled ? "grid grid-cols-2 gap-3" : "space-y-3"}>
      {googleEnabled && (
        <form action={signInWithGoogle}>
          <button type="submit" className={buttonClass}>
            <GoogleIcon className="h-5 w-5" /> Google
          </button>
        </form>
      )}

      {githubEnabled && (
        <form action={signInWithGitHub}>
          <button type="submit" className={buttonClass}>
            <GitHubIcon className="h-5 w-5" /> GitHub
          </button>
        </form>
      )}
    </div>
  );
}
