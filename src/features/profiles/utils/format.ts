const MONTH_YEAR = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats an ISO date (YYYY-MM-DD) as "Mar 2024". */
function formatMonthYear(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? isoDate : MONTH_YEAR.format(parsed);
}

/**
 * Renders a human-readable date range for an education or experience entry.
 * Returns an empty string when there is nothing meaningful to show.
 */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  ongoing: boolean,
): string {
  const start = startDate ? formatMonthYear(startDate) : "";
  const end = ongoing ? "Present" : endDate ? formatMonthYear(endDate) : "";

  if (start && end) {
    return `${start} — ${end}`;
  }

  return start || end;
}

/** Turns an enum value such as OPEN_TO_OPPORTUNITIES into "Open to opportunities". */
export function formatEnumLabel(value: string): string {
  const words = value.toLowerCase().replaceAll("_", " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}
