import { Skeleton } from "./primitives";

/**
 * Placeholder shown while a route segment streams in.
 *
 * Mirrors the usual page shape - header, stat row, content block - so the
 * layout does not jump once the real content arrives.
 */
export function PageSkeleton({ stats = 3, rows = 4 }: { stats?: number; rows?: number }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6" role="status" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="skeleton h-9 w-64" />
        <Skeleton className="skeleton h-5 w-96 max-w-full" />
      </div>

      {stats > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: stats }).map((_, index) => (
            <Skeleton key={index} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-line p-5">
        <Skeleton className="skeleton h-6 w-40" />

        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="skeleton h-14 rounded-lg" />
        ))}
      </div>

      <span className="sr-only">Loading content</span>
    </div>
  );
}
