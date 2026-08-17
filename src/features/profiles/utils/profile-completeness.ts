type CompletenessProfile = {
  fullName: string;
  headline: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  country: string | null;
  city: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  education: unknown[];
  experience: unknown[];
};

export function calculateProfileCompleteness(profile: CompletenessProfile) {
  const checks = [
    Boolean(profile.fullName),
    Boolean(profile.headline),
    Boolean(profile.bio),
    Boolean(profile.profileImageUrl),
    Boolean(profile.country || profile.city),
    Boolean(profile.githubUrl),
    Boolean(profile.portfolioUrl),
    profile.education.length > 0,
    profile.experience.length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
}
