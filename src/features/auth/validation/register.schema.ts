import { z } from "zod";

/**
 * Only two account types can self-register.
 *
 * REVIEWER is deliberately absent: reviewers decide whether a skill becomes
 * Verified, so allowing self-service reviewer signup would let anyone verify
 * their own work and make verification meaningless. Reviewers are appointed by
 * an admin. ADMIN is seeded, never registered.
 */
export const ACCOUNT_TYPES = ["CANDIDATE", "COMPANY"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

const fullName = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(100, "Full name must not exceed 100 characters.");

// Normalise before validating so surrounding whitespace and casing are not
// treated as a malformed address.
const email = z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address."));

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  error: {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  },
};

export const candidateRegisterSchema = z
  .object({
    accountType: z.literal("CANDIDATE"),
    fullName,
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.error);

export const companyRegisterSchema = z
  .object({
    accountType: z.literal("COMPANY"),
    fullName,
    email,
    password,
    confirmPassword: z.string(),

    companyName: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters.")
      .max(150, "Company name must not exceed 150 characters."),

    jobTitle: z
      .string()
      .trim()
      .max(100, "Job title must not exceed 100 characters.")
      .transform((value) => (value === "" ? null : value)),

    companyWebsite: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || z.url({ protocol: /^https?$/ }).safeParse(value).success,
        "Please enter a valid http(s) URL.",
      )
      .transform((value) => (value === "" ? null : value)),
  })
  .refine(passwordsMatch.check, passwordsMatch.error);

/**
 * Discriminated on accountType so the client cannot submit company fields as a
 * candidate, or omit them as a company.
 */
export const registerSchema = z.discriminatedUnion("accountType", [
  candidateRegisterSchema,
  companyRegisterSchema,
]);

export type CandidateRegisterInput = z.infer<typeof candidateRegisterSchema>;
export type CompanyRegisterInput = z.infer<typeof companyRegisterSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
