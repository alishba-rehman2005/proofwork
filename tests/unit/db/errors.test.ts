import { describe, expect, it } from "vitest";

import { isUniqueViolation } from "@/db/errors";

describe("isUniqueViolation", () => {
  it("detects a unique constraint violation", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("ignores other postgres errors", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });

  it("matches a named constraint", () => {
    const error = { code: "23505", constraint_name: "social_links_candidate_platform_unique" };

    expect(isUniqueViolation(error, "social_links_candidate_platform_unique")).toBe(true);
  });

  it("rejects a different constraint on the same table", () => {
    const error = { code: "23505", constraint_name: "some_other_unique_index" };

    expect(isUniqueViolation(error, "social_links_candidate_platform_unique")).toBe(false);
  });

  it("unwraps a DrizzleQueryError that nests the driver error on cause", () => {
    // Drizzle throws its own error and hangs the PostgresError off `cause`.
    const wrapped = Object.assign(new Error("Failed query: insert into ..."), {
      cause: {
        code: "23505",
        constraint_name: "social_links_candidate_platform_unique",
      },
    });

    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isUniqueViolation(wrapped, "social_links_candidate_platform_unique")).toBe(true);
    expect(isUniqueViolation(wrapped, "a_different_constraint")).toBe(false);
  });

  it("finds the driver error more than one level down", () => {
    const nested = { cause: { cause: { code: "23505" } } };

    expect(isUniqueViolation(nested)).toBe(true);
  });

  it("does not loop forever on a cyclic cause chain", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.cause = cyclic;

    expect(isUniqueViolation(cyclic)).toBe(false);
  });

  it("handles non-postgres errors safely", () => {
    expect(isUniqueViolation(new Error("connection lost"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation("boom")).toBe(false);
  });
});
