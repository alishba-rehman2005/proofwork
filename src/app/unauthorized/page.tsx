import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Access denied</h1>

        <p className="mt-3 text-slate-600">You do not have permission to access this page.</p>

        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg border px-4 py-2"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
