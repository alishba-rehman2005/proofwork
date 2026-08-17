import { describe, expect, it } from "vitest";

import {
  educationSchema,
  experienceSchema,
  profileSchema,
  socialLinkSchema,
} from "@/features/profiles/validation/profile.schema";

const validProfile = {
  fullName: "Test Candidate",
  headline: "",
  bio: "",
  location: "",
  country: "",
  city: "",
  availability: null,
  profileVisibility: "RECRUITERS_ONLY",
  githubUrl: "",
  portfolioUrl: "",
  websiteUrl: "",
};

describe("profileSchema", () => {
  it("normalises blank optional fields to null", () => {
    const result = profileSchema.safeParse(validProfile);

    expect(result.success).toBe(true);
    expect(result.data?.headline).toBeNull();
    expect(result.data?.bio).toBeNull();
    expect(result.data?.githubUrl).toBeNull();
  });

  it("trims and keeps a valid URL", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      githubUrl: "  https://github.com/example  ",
    });

    expect(result.success).toBe(true);
    expect(result.data?.githubUrl).toBe("https://github.com/example");
  });

  it("rejects a malformed URL", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      githubUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it.each([
    "javascript:alert(document.cookie)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "ftp://example.com/file",
  ])("rejects the non-http scheme %s", (url) => {
    // These are valid URLs as far as a bare z.url() is concerned, so the
    // scheme restriction is what keeps them out of the database.
    expect(profileSchema.safeParse({ ...validProfile, githubUrl: url }).success).toBe(false);
  });

  it.each(["https://example.com/a", "http://example.com"])("accepts %s", (url) => {
    expect(profileSchema.safeParse({ ...validProfile, githubUrl: url }).success).toBe(true);
  });

  it("rejects a full name shorter than two characters", () => {
    const result = profileSchema.safeParse({ ...validProfile, fullName: "A" });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown visibility value", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      profileVisibility: "EVERYONE",
    });

    expect(result.success).toBe(false);
  });
});

const validEducation = {
  institution: "Example University",
  degree: "",
  fieldOfStudy: "",
  startDate: "2020-09-01",
  endDate: "2024-06-30",
  currentlyStudying: false,
  description: "",
};

describe("educationSchema", () => {
  it("accepts a chronological date range", () => {
    expect(educationSchema.safeParse(validEducation).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = educationSchema.safeParse({
      ...validEducation,
      endDate: "2019-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("ignores the end date when still studying", () => {
    const result = educationSchema.safeParse({
      ...validEducation,
      endDate: "2019-01-01",
      currentlyStudying: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a malformed date", () => {
    const result = educationSchema.safeParse({
      ...validEducation,
      startDate: "01/09/2020",
    });

    expect(result.success).toBe(false);
  });

  it("requires a start date", () => {
    const result = educationSchema.safeParse({ ...validEducation, startDate: "" });

    expect(result.success).toBe(false);
  });

  it("still treats a blank end date as null", () => {
    const result = educationSchema.safeParse({ ...validEducation, endDate: "" });

    expect(result.success).toBe(true);
    expect(result.data?.endDate).toBeNull();
  });

  it("rejects a non-uuid id", () => {
    const result = educationSchema.safeParse({ ...validEducation, id: "123" });

    expect(result.success).toBe(false);
  });
});

const validExperience = {
  company: "Example Inc.",
  jobTitle: "Frontend Engineer",
  employmentType: "",
  location: "",
  startDate: "2022-01-01",
  endDate: "2023-01-01",
  currentlyWorking: false,
  description: "",
};

describe("experienceSchema", () => {
  it("accepts a chronological date range", () => {
    expect(experienceSchema.safeParse(validExperience).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      endDate: "2021-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("ignores the end date when currently working", () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      endDate: "2021-01-01",
      currentlyWorking: true,
    });

    expect(result.success).toBe(true);
  });

  it("requires a start date", () => {
    const result = experienceSchema.safeParse({ ...validExperience, startDate: "" });

    expect(result.success).toBe(false);
  });

  it("requires a job title", () => {
    const result = experienceSchema.safeParse({ ...validExperience, jobTitle: "" });

    expect(result.success).toBe(false);
  });
});

describe("socialLinkSchema", () => {
  it("accepts a valid platform and URL", () => {
    const result = socialLinkSchema.safeParse({
      platform: "GITHUB",
      label: "",
      url: "https://github.com/example",
    });

    expect(result.success).toBe(true);
    expect(result.data?.label).toBeNull();
  });

  it("rejects an unknown platform", () => {
    const result = socialLinkSchema.safeParse({
      platform: "MYSPACE",
      label: "",
      url: "https://example.com",
    });

    expect(result.success).toBe(false);
  });

  it("requires a valid URL", () => {
    const result = socialLinkSchema.safeParse({
      platform: "GITHUB",
      label: "",
      url: "example.com",
    });

    expect(result.success).toBe(false);
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "vbscript:x"])(
    "rejects the non-http scheme %s",
    (url) => {
      expect(socialLinkSchema.safeParse({ platform: "GITHUB", label: "", url }).success).toBe(
        false,
      );
    },
  );
});
