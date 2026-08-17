import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_VIEWER,
  canViewProfile,
  describeVisibility,
  type ProfileViewer,
  type VisibilityTarget,
} from "@/features/profiles/utils/visibility";

const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

const target = (profileVisibility: VisibilityTarget["profileVisibility"]): VisibilityTarget => ({
  userId: OWNER_ID,
  profileVisibility,
});

const owner: ProfileViewer = { userId: OWNER_ID, roles: ["CANDIDATE"] };
const otherCandidate: ProfileViewer = { userId: OTHER_ID, roles: ["CANDIDATE"] };
const recruiter: ProfileViewer = { userId: OTHER_ID, roles: ["RECRUITER"] };
const reviewer: ProfileViewer = { userId: OTHER_ID, roles: ["REVIEWER"] };
const admin: ProfileViewer = { userId: OTHER_ID, roles: ["ADMIN"] };

describe("canViewProfile", () => {
  it("always lets the owner view their own profile", () => {
    expect(canViewProfile(target("PRIVATE"), owner)).toBe(true);
    expect(canViewProfile(target("RECRUITERS_ONLY"), owner)).toBe(true);
    expect(canViewProfile(target("PUBLIC"), owner)).toBe(true);
  });

  it("always lets an admin view any profile", () => {
    expect(canViewProfile(target("PRIVATE"), admin)).toBe(true);
    expect(canViewProfile(target("RECRUITERS_ONLY"), admin)).toBe(true);
  });

  it("keeps PRIVATE profiles hidden from everyone else", () => {
    expect(canViewProfile(target("PRIVATE"), ANONYMOUS_VIEWER)).toBe(false);
    expect(canViewProfile(target("PRIVATE"), otherCandidate)).toBe(false);
    expect(canViewProfile(target("PRIVATE"), recruiter)).toBe(false);
    expect(canViewProfile(target("PRIVATE"), reviewer)).toBe(false);
  });

  it("limits RECRUITERS_ONLY to recruiters", () => {
    expect(canViewProfile(target("RECRUITERS_ONLY"), recruiter)).toBe(true);
    expect(canViewProfile(target("RECRUITERS_ONLY"), ANONYMOUS_VIEWER)).toBe(false);
    expect(canViewProfile(target("RECRUITERS_ONLY"), otherCandidate)).toBe(false);
    expect(canViewProfile(target("RECRUITERS_ONLY"), reviewer)).toBe(false);
  });

  it("opens PUBLIC profiles to signed-out visitors", () => {
    expect(canViewProfile(target("PUBLIC"), ANONYMOUS_VIEWER)).toBe(true);
    expect(canViewProfile(target("PUBLIC"), otherCandidate)).toBe(true);
    expect(canViewProfile(target("PUBLIC"), reviewer)).toBe(true);
  });

  it("does not treat a null viewer id as matching a null-ish owner", () => {
    const orphan = { userId: "", profileVisibility: "PRIVATE" } as VisibilityTarget;

    expect(canViewProfile(orphan, ANONYMOUS_VIEWER)).toBe(false);
  });
});

describe("describeVisibility", () => {
  it("describes each visibility level", () => {
    expect(describeVisibility("PUBLIC")).toMatch(/anyone/i);
    expect(describeVisibility("RECRUITERS_ONLY")).toMatch(/recruiters/i);
    expect(describeVisibility("PRIVATE")).toMatch(/only you/i);
  });
});
