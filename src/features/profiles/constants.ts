/** Option lists shared by the profile forms. Values mirror the database enums. */

export const AVAILABILITY_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OPEN_TO_OPPORTUNITIES", label: "Open to opportunities" },
  { value: "NOT_AVAILABLE", label: "Not available" },
] as const;

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Private" },
  { value: "RECRUITERS_ONLY", label: "Recruiters only" },
  { value: "PUBLIC", label: "Public" },
] as const;

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GITHUB", label: "GitHub" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BEHANCE", label: "Behance" },
  { value: "DRIBBBLE", label: "Dribbble" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Other" },
] as const;
