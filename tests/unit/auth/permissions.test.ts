import { describe, expect, it } from "vitest";

import { APP_ROLES, hasAllRoles, hasAnyRole, hasRole, isAdmin } from "@/lib/auth/permissions";

describe("auth permissions", () => {
  it("detects an assigned role", () => {
    expect(hasRole(["CANDIDATE"], APP_ROLES.CANDIDATE)).toBe(true);
  });

  it("returns false for missing role", () => {
    expect(hasRole(["CANDIDATE"], APP_ROLES.ADMIN)).toBe(false);
  });

  it("supports multiple roles", () => {
    expect(
      hasAnyRole(["CANDIDATE", "REVIEWER"], [APP_ROLES.REVIEWER, APP_ROLES.ADMIN]),
    ).toBe(true);
  });

  it("checks all required roles", () => {
    expect(
      hasAllRoles(
        ["CANDIDATE", "REVIEWER"],
        [APP_ROLES.CANDIDATE, APP_ROLES.REVIEWER],
      ),
    ).toBe(true);
  });

  it("detects admin users", () => {
    expect(isAdmin(["ADMIN"])).toBe(true);
  });
});
