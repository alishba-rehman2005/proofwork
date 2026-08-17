import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui";
import { LoginForm } from "@/features/auth/components/login-form";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import { isOAuthConfigured } from "@/features/auth/oauth-config";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const oauth = isOAuthConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[540px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <section className="w-full px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mx-auto flex h-full max-w-[420px] flex-col justify-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>

              <p className="mt-2 text-muted">Sign in to your professional account.</p>
            </div>

            {params.registered === "true" && (
              <div className="mt-6">
                <Alert tone="success">Account created. You can sign in now.</Alert>
              </div>
            )}

            <div className="mt-8">
              <LoginForm />
            </div>

            {oauth.any && (
              <>
                <div className="my-7 flex items-center gap-5" aria-hidden="true">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs font-semibold tracking-[0.12em] text-muted">
                    OR CONTINUE WITH
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <SocialAuthButtons
                  googleEnabled={oauth.google}
                  githubEnabled={oauth.github}
                  compact
                />
              </>
            )}

            <p className="mt-10 text-center text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-foreground hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
