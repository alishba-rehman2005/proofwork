import { z } from "zod";

export const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

const requiredText = (min: number, max: number, field: string) =>
  z
    .string()
    .trim()
    .min(min, `${field} must be at least ${min} characters.`)
    .max(max, `${field} must not exceed ${max} characters.`);

const optionalNumber = (field: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isFinite(value) && value >= min && value <= max),
      `${field} must be between ${min} and ${max}.`,
    );

export const assessmentSchema = z
  .object({
    title: requiredText(4, 150, "Title"),
    description: requiredText(20, 4000, "Description"),
    requirements: requiredText(20, 4000, "Requirements"),
    submissionInstructions: requiredText(10, 2000, "Submission instructions"),

    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),

    maximumScore: z.coerce.number().int().min(10).max(1000),
    passingScore: z.coerce.number().int().min(1).max(1000),
    maxAttempts: z.coerce.number().int().min(1).max(10),

    estimatedDurationMinutes: optionalNumber("Estimated duration", 5, 10000),

    skillIds: z.array(z.uuid()).min(1, "Select at least one skill this assessment verifies."),
  })
  .refine((data) => data.passingScore <= data.maximumScore, {
    path: ["passingScore"],
    message: "Passing score cannot exceed the maximum score.",
  });

export const rubricCriterionSchema = z.object({
  assessmentId: z.uuid(),
  name: requiredText(2, 120, "Criterion name"),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value === "" ? null : value)),
  maximumPoints: z.coerce.number().min(1).max(1000),
  weight: z.coerce.number().min(0).max(100),
});

export const assessmentResourceSchema = z.object({
  assessmentId: z.uuid(),
  title: requiredText(2, 150, "Resource title"),
  url: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL." })),
  resourceType: z
    .string()
    .trim()
    .max(50)
    .transform((value) => (value === "" ? null : value)),
});

export const assignAssessmentSchema = z.object({
  verificationRequestId: z.uuid(),
  assessmentId: z.uuid("Choose an assessment."),
  reviewerId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || z.uuid().safeParse(value).success, "Invalid reviewer."),
  deadline: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a deadline.")
    .refine(
      (value) => new Date(`${value}T23:59:59Z`) > new Date(),
      "Deadline must be in the future.",
    ),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
