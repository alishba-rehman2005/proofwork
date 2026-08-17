import { describe, expect, it } from "vitest";

import { buildProfileSlug, slugifyName } from "@/features/profiles/utils/slug";

const ID = "de725eb2-9c1f-4c2a-9f1e-0a1b2c3d4e5f";

describe("slugifyName", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugifyName("Alishba Rehman")).toBe("alishba-rehman");
  });

  it("collapses runs of separators", () => {
    expect(slugifyName("Anna   -- Maria")).toBe("anna-maria");
  });

  it("trims leading and trailing separators", () => {
    expect(slugifyName("  !Jane!  ")).toBe("jane");
  });

  it("folds accents to base letters", () => {
    expect(slugifyName("Zoë Ödegaard")).toBe("zoe-odegaard");
  });

  it("falls back when the name has no alphanumeric characters", () => {
    expect(slugifyName("!!!")).toBe("candidate");
    expect(slugifyName("")).toBe("candidate");
  });

  it("never returns a value needing URL encoding", () => {
    for (const name of ["Zoë Ödegaard", "!!!", "A/B \\ C?", "Ünïcodé Nâme"]) {
      const slug = slugifyName(name);

      expect(encodeURIComponent(slug)).toBe(slug);
    }
  });
});

describe("buildProfileSlug", () => {
  it("appends a short id fragment", () => {
    expect(buildProfileSlug("Alishba Rehman", ID)).toBe("alishba-rehman-de725eb2");
  });

  it("distinguishes candidates who share a name", () => {
    const a = buildProfileSlug("John Smith", "aaaaaaaa-0000-0000-0000-000000000000");
    const b = buildProfileSlug("John Smith", "bbbbbbbb-0000-0000-0000-000000000000");

    expect(a).not.toBe(b);
  });

  it("stays URL-safe for a name with no usable characters", () => {
    const slug = buildProfileSlug("???", ID);

    expect(slug).toBe("candidate-de725eb2");
    expect(encodeURIComponent(slug)).toBe(slug);
  });
});
