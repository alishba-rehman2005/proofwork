import Link from "next/link";

import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>

          <p className="text-sm text-slate-600">Sign in to continue to ProofWork.</p>
        </div>

        {params.registered === "true" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Account created successfully. You can now sign in.
          </div>
        )}

        <LoginForm />

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
