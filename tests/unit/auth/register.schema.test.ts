import { describe, expect, it } from "vitest";

import { registerSchema } from "@/features/auth/validation/register.schema";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      fullName: "Test Candidate",
      email: "candidate@test.com",
      password: "ProofWork123",
      confirmPassword: "ProofWork123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      fullName: "Test Candidate",
      email: "candidate@test.com",
      password: "ProofWork123",
      confirmPassword: "Different123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Test Candidate",
      email: "candidate@test.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);
  });
});
