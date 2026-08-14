import Link from "next/link";

import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Create your ProofWork account</h1>

          <p className="text-sm text-slate-600">
            Build your professional profile and verify what you can actually do.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
