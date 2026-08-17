/** PostgreSQL error codes we handle explicitly. */
const UNIQUE_VIOLATION = "23505";

/** Guards against a cyclic or pathologically deep cause chain. */
const MAX_CAUSE_DEPTH = 5;

type PostgresErrorLike = {
  code?: unknown;
  constraint_name?: unknown;
};

/**
 * Finds the driver-level Postgres error inside a thrown value.
 *
 * Drizzle wraps driver failures in a DrizzleQueryError and hangs the original
 * PostgresError off `cause`, so the fields we need are never on the outermost
 * error. Walk the chain rather than inspecting only the top.
 */
function findPostgresError(error: unknown, depth = 0): PostgresErrorLike | null {
  if (depth > MAX_CAUSE_DEPTH || typeof error !== "object" || error === null) {
    return null;
  }

  const candidate = error as PostgresErrorLike & { cause?: unknown };

  if (typeof candidate.code === "string") {
    return candidate;
  }

  return findPostgresError(candidate.cause, depth + 1);
}

/**
 * True when the error is a unique constraint violation.
 *
 * Pass `constraintName` to narrow the check to a single index, so an unrelated
 * conflict is not reported to the user as a duplicate.
 */
export function isUniqueViolation(error: unknown, constraintName?: string): boolean {
  const pgError = findPostgresError(error);

  if (pgError?.code !== UNIQUE_VIOLATION) {
    return false;
  }

  return constraintName ? pgError.constraint_name === constraintName : true;
}
