import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[1180px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex">
        <section className="w-full px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mx-auto flex h-full max-w-[420px] flex-col justify-center">
            <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>

            <p className="mt-2 text-muted">
              Tell us the email on your account and we will start the recovery process.
            </p>

            <div className="mt-8">
              <ForgotPasswordForm />
            </div>

            {/*
              Automated delivery is not wired up yet, and a form that silently
              does nothing is worse than one that says so.
            */}
            <div className="mt-6">
              <Alert tone="info" title="How recovery works today">
                Automated reset emails are not enabled on this deployment. An administrator
                completes the reset manually, so requests are recorded rather than emailed.
              </Alert>
            </div>

            <p className="mt-8 text-center text-muted">
              Remembered it?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </section>

        <AuthBrandPanel
          heading="Your verified work stays yours."
          body="Recovering access never changes what a reviewer already approved."
        />
      </div>
    </main>
  );
}
