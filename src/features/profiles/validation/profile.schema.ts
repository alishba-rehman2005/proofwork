import { z } from "zod";

/*
|--------------------------------------------------------------------------
| SHARED FIELD BUILDERS
|--------------------------------------------------------------------------
| Profile forms submit empty strings for untouched inputs. These helpers trim
| the value, validate it, and normalise "" to null so it maps cleanly onto the
| nullable columns in the database.
*/

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Optional free text, stored as null when blank. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Must not exceed ${max} characters.`)
    .transform((value) => (value === "" ? null : value));
}

/**
 * Only http(s) links are accepted.
 *
 * A bare `z.url()` also accepts `javascript:`, `data:` and `vbscript:` URLs.
 * Those get rendered into href attributes and handed to other consumers later
 * (APIs, exports, emails), so restrict the scheme at the boundary rather than
 * relying on the rendering layer to neutralise them.
 */
const HTTP_PROTOCOL = /^https?$/;

const URL_MESSAGE = "Please enter a valid http(s) URL.";

/** Optional absolute http(s) URL, stored as null when blank. */
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.url({ protocol: HTTP_PROTOCOL }).safeParse(value).success,
    URL_MESSAGE,
  )
  .transform((value) => (value === "" ? null : value));

/** Optional calendar date in YYYY-MM-DD form, stored as null when blank. */
const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || ISO_DATE_PATTERN.test(value), "Please enter a valid date.")
  .transform((value) => (value === "" ? null : value));

/** Required calendar date in YYYY-MM-DD form. */
const requiredDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE_PATTERN.test(value), "Please enter a start date.");

/**
 * End date may not precede start date unless the entry is still ongoing.
 * Both values are ISO dates, so a lexicographic comparison is chronological.
 */
function isChronological(
  startDate: string | null,
  endDate: string | null,
  ongoing: boolean,
): boolean {
  if (ongoing || !startDate || !endDate) {
    return true;
  }

  return endDate >= startDate;
}

const DATE_ORDER_ERROR = {
  path: ["endDate"],
  message: "End date cannot be before start date.",
};

/*
|--------------------------------------------------------------------------
| SCHEMAS
|--------------------------------------------------------------------------
*/

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters.")
    .max(100, "Full name must not exceed 100 characters."),

  headline: optionalText(160),
  bio: optionalText(2000),
  location: optionalText(150),
  country: optionalText(100),
  city: optionalText(100),

  availability: z.enum(["AVAILABLE", "OPEN_TO_OPPORTUNITIES", "NOT_AVAILABLE"]).nullable(),

  profileVisibility: z.enum(["PRIVATE", "RECRUITERS_ONLY", "PUBLIC"]),

  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export const educationSchema = z
  .object({
    id: z.uuid().optional(),

    institution: z
      .string()
      .trim()
      .min(2, "Institution must contain at least 2 characters.")
      .max(200, "Institution must not exceed 200 characters."),

    degree: optionalText(200),
    fieldOfStudy: optionalText(200),

    startDate: requiredDate,
    endDate: optionalDate,

    currentlyStudying: z.boolean(),

    description: optionalText(1500),
  })
  .refine(
    (data) => isChronological(data.startDate, data.endDate, data.currentlyStudying),
    DATE_ORDER_ERROR,
  );

export const experienceSchema = z
  .object({
    id: z.uuid().optional(),

    company: z
      .string()
      .trim()
      .min(2, "Company must contain at least 2 characters.")
      .max(200, "Company must not exceed 200 characters."),

    jobTitle: z
      .string()
      .trim()
      .min(2, "Job title must contain at least 2 characters.")
      .max(200, "Job title must not exceed 200 characters."),

    employmentType: optionalText(100),
    location: optionalText(150),

    startDate: requiredDate,
    endDate: optionalDate,

    currentlyWorking: z.boolean(),

    description: optionalText(1500),
  })
  .refine(
    (data) => isChronological(data.startDate, data.endDate, data.currentlyWorking),
    DATE_ORDER_ERROR,
  );

export const socialLinkSchema = z.object({
  id: z.uuid().optional(),

  platform: z.enum(["LINKEDIN", "GITHUB", "PORTFOLIO", "BEHANCE", "DRIBBBLE", "WEBSITE", "OTHER"]),

  label: optionalText(100),

  url: z
    .string()
    .trim()
    .pipe(z.url({ protocol: HTTP_PROTOCOL, error: URL_MESSAGE })),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
