import { describe, expect, it } from "vitest";

import { formatDateRange, formatEnumLabel } from "@/features/profiles/utils/format";

describe("formatDateRange", () => {
  it("formats a closed range", () => {
    expect(formatDateRange("2020-09-01", "2024-06-30", false)).toBe("Sep 2020 — Jun 2024");
  });

  it("shows Present for an ongoing entry", () => {
    expect(formatDateRange("2022-01-01", null, true)).toBe("Jan 2022 — Present");
  });

  it("ignores a stored end date when the entry is ongoing", () => {
    expect(formatDateRange("2022-01-01", "2023-01-01", true)).toBe("Jan 2022 — Present");
  });

  it("returns only the start when there is no end", () => {
    expect(formatDateRange("2022-01-01", null, false)).toBe("Jan 2022");
  });

  it("returns an empty string when there are no dates", () => {
    expect(formatDateRange(null, null, false)).toBe("");
  });

  it("does not shift the month across time zones", () => {
    expect(formatDateRange("2022-01-01", null, false)).toBe("Jan 2022");
    expect(formatDateRange("2022-12-31", null, false)).toBe("Dec 2022");
  });
});

describe("formatEnumLabel", () => {
  it("humanises a multi-word enum value", () => {
    expect(formatEnumLabel("OPEN_TO_OPPORTUNITIES")).toBe("Open to opportunities");
  });

  it("humanises a single-word enum value", () => {
    expect(formatEnumLabel("GITHUB")).toBe("Github");
  });
});
