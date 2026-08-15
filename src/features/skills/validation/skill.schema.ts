import { z } from "zod";

export const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
] as const;

export const addCandidateSkillSchema = z.object({
  skillId: z.uuid("Choose a skill."),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
});

export const updateCandidateSkillSchema = z.object({
  candidateSkillId: z.uuid(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
});

export const candidateSkillIdSchema = z.uuid("Invalid skill reference.");

export const skillRequestSchema = z.object({
  proposedName: z
    .string()
    .trim()
    .min(2, "Skill name must be at least 2 characters.")
    .max(80, "Skill name must not exceed 80 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters.")
    .transform((value) => (value === "" ? null : value)),
});

export type AddCandidateSkillInput = z.infer<typeof addCandidateSkillSchema>;
