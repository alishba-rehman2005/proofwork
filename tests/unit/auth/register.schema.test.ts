import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPES, registerSchema } from "@/features/auth/validation/register.schema";

const validCandidate = {
  accountType: "CANDIDATE",
  fullName: "Test Candidate",
  email: "candidate@test.com",
  password: "ProofWork123",
  confirmPassword: "ProofWork123",
};

const validCompany = {
  accountType: "COMPANY",
  fullName: "Talent Person",
  email: "hiring@test.com",
  password: "ProofWork123",
  confirmPassword: "ProofWork123",
  companyName: "Example Inc.",
  jobTitle: "Talent Partner",
  companyWebsite: "https://example.com",
};

describe("self-service account types", () => {
  it("offers only candidate and company", () => {
    expect([...ACCOUNT_TYPES]).toEqual(["CANDIDATE", "COMPANY"]);
  });

  it.each(["REVIEWER", "ADMIN"])("refuses to register a %s", (accountType) => {
    // Reviewers decide whether a skill becomes Verified, so self-service
    // signup for that role would make verification meaningless.
    expect(registerSchema.safeParse({ ...validCandidate, accountType }).success).toBe(false);
  });
});

describe("candidate registration", () => {
  it("accepts valid data", () => {
    expect(registerSchema.safeParse(validCandidate).success).toBe(true);
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      ...validCandidate,
      confirmPassword: "Different123",
    });

    expect(result.success).toBe(false);
  });

  it.each(["password", "PROOFWORK123", "proofwork123", "Short1"])(
    "rejects the weak password %s",
    (password) => {
      const result = registerSchema.safeParse({
        ...validCandidate,
        password,
        confirmPassword: password,
      });

      expect(result.success).toBe(false);
    },
  );

  it("normalises the email before validating", () => {
    const result = registerSchema.safeParse({
      ...validCandidate,
      email: "  Candidate@Test.COM  ",
    });

    expect(result.success).toBe(true);
    expect(result.data && "email" in result.data ? result.data.email : null).toBe(
      "candidate@test.com",
    );
  });

  it("ignores company fields sent by a candidate", () => {
    const result = registerSchema.safeParse({ ...validCandidate, companyName: "Sneaky Ltd" });

    expect(result.success).toBe(true);
    expect(result.data && "companyName" in result.data).toBe(false);
  });
});

describe("company registration", () => {
  it("accepts valid data", () => {
    expect(registerSchema.safeParse(validCompany).success).toBe(true);
  });

  it("requires a company name", () => {
    const result = registerSchema.safeParse({ ...validCompany, companyName: "" });

    expect(result.success).toBe(false);
  });

  it("treats blank optional company fields as null", () => {
    const result = registerSchema.safeParse({
      ...validCompany,
      jobTitle: "",
      companyWebsite: "",
    });

    expect(result.success).toBe(true);

    if (result.success && result.data.accountType === "COMPANY") {
      expect(result.data.jobTitle).toBeNull();
      expect(result.data.companyWebsite).toBeNull();
    }
  });

  it.each(["javascript:alert(1)", "not-a-url", "data:text/html,x"])(
    "rejects the company website %s",
    (companyWebsite) => {
      expect(registerSchema.safeParse({ ...validCompany, companyWebsite }).success).toBe(false);
    },
  );
});
