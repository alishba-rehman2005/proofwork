import { describe, expect, it } from "vitest";

import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";

const emptyProfile = {
  fullName: "",
  headline: null,
  bio: null,
  profileImageUrl: null,
  country: null,
  city: null,
  githubUrl: null,
  portfolioUrl: null,
  education: [],
  experience: [],
};

const completeProfile = {
  fullName: "Test Candidate",
  headline: "Frontend Engineer",
  bio: "A short bio.",
  profileImageUrl: "https://cdn.example.com/avatar.png",
  country: "Pakistan",
  city: "Lahore",
  githubUrl: "https://github.com/example",
  portfolioUrl: "https://example.com",
  education: [{}],
  experience: [{}],
};

describe("calculateProfileCompleteness", () => {
  it("returns 0 for an empty profile", () => {
    expect(calculateProfileCompleteness(emptyProfile)).toBe(0);
  });

  it("returns 100 for a fully populated profile", () => {
    expect(calculateProfileCompleteness(completeProfile)).toBe(100);
  });

  it("counts country or city as a single location check", () => {
    const cityOnly = calculateProfileCompleteness({ ...emptyProfile, city: "Lahore" });
    const both = calculateProfileCompleteness({
      ...emptyProfile,
      city: "Lahore",
      country: "Pakistan",
    });

    expect(cityOnly).toBe(both);
  });

  it("increases as fields are filled in", () => {
    const partial = calculateProfileCompleteness({
      ...emptyProfile,
      fullName: "Test Candidate",
      bio: "A short bio.",
    });

    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(100);
  });
});
