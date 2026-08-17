import { z } from "zod";

export const loginSchema = z.object({
  // Normalise before validating so surrounding whitespace and casing are not
  // treated as a malformed address.
  email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address.")),

  password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;
