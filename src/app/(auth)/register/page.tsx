import type { Metadata } from "next";
import Link from "next/link";

import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { RegisterForm } from "@/features/auth/components/register-form";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import { isOAuthConfigured } from "@/features/auth/oauth-config";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function RegisterPage() {
  const oauth = isOAuthConfigured();

  return (
    <main className="register-page-density flex min-h-screen items-center justify-center px-4 pt-20 pb-6 sm:pt-24 lg:p-8">
      <div className="w-full max-w-[1180px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex">
        <section className="w-full px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-[480px]">
            <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>

            <p className="mt-2 text-muted">
              Build a profile backed by work a mentor has actually reviewed.
            </p>

            <div className="mt-8">
              <RegisterForm />
            </div>

            {oauth.any && (
              <>
                <div className="my-6 flex items-center gap-4" aria-hidden="true">
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

            <p className="mt-8 text-center text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <AuthBrandPanel
          heading="Verified work. Credible skills."
          body="Build a professional identity supported by practical evidence."
        />
      </div>
    </main>
  );
}
