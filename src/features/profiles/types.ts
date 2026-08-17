import type { InferSelectModel } from "drizzle-orm";

import type { candidateProfiles, education, experience, socialLinks } from "@/db/schema";

export type CandidateProfile = InferSelectModel<typeof candidateProfiles>;
export type EducationItem = InferSelectModel<typeof education>;
export type ExperienceItem = InferSelectModel<typeof experience>;
export type SocialLinkItem = InferSelectModel<typeof socialLinks>;

export type CandidateProfileWithRelations = CandidateProfile & {
  education: EducationItem[];
  experience: ExperienceItem[];
  socialLinks: SocialLinkItem[];
};
