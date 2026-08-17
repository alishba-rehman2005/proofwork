import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="animate-rise max-w-md text-center">
        <p className="tabular text-sm font-medium text-muted">404</p>

        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>

        <p className="mt-3 text-muted">
          This page does not exist, or it is not visible to your account.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>

          <ButtonLink href="/dashboard" variant="secondary">
            Go to dashboard
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
