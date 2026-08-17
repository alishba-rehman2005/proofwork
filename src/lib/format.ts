/*
|--------------------------------------------------------------------------
| DATE FORMATTING
|--------------------------------------------------------------------------
| Deterministic on purpose.
|
| `toLocaleDateString()` resolves against whatever locale and timezone the
| runtime happens to have, so the server rendered "8/14/2026" while a browser
| set to en-GB rendered "14/08/2026" - a hydration mismatch that only shows up
| for users outside the server's locale.
|
| Pinning both the locale and the timezone means the markup matches on both
| sides, and a date is never shifted a day by the viewer's offset.
*/

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

type DateInput = Date | string | number;

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "14 Aug 2026" */
export function formatDate(value: DateInput): string {
  const date = toDate(value);

  return date ? DATE.format(date) : "—";
}

/** e.g. "14 Aug 2026, 09:30" */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);

  return date ? DATE_TIME.format(date) : "—";
}

/** Whole days until a date; negative once it has passed. */
export function daysUntil(value: DateInput): number {
  const date = toDate(value);

  if (!date) {
    return 0;
  }

  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}
