import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/auth/validation/login.schema";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "candidate@test.com",
      password: "ProofWork123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "ProofWork123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "candidate@test.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
