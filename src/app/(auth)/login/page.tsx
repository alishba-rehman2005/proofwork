import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
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
    <main className="flex min-h-screen items-center justify-center px-4 pt-20 pb-6 sm:pt-24 lg:p-8">
      {/*
        Same split as register. Sign in used to be a bare white box with no
        brand on it at all, so the two halves of the same flow looked like they
        came from different products.
      */}
      <div className="w-full max-w-[1080px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex">
        <section className="w-full px-6 py-10 sm:px-12 lg:px-14 lg:py-16">
          <div className="mx-auto flex h-full max-w-[420px] flex-col justify-center">
            <div>
              <h1 className="text-[30px] leading-tight font-semibold tracking-tight">
                Welcome back
              </h1>

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
                <div className="my-7 flex items-center gap-4" aria-hidden="true">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs font-semibold tracking-[0.08em] text-muted">
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
              <Link
                href="/register"
                className="-mx-1 inline-flex min-h-11 items-center rounded-md px-1 font-medium text-foreground hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>

        <AuthBrandPanel
          variant="sign-in"
          heading="Pick up exactly where you left off."
          body="Your assessments, reviews, and hiring activity are waiting in one place."
        />
      </div>
    </main>
  );
}
