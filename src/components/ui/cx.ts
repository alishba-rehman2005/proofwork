/**
 * Joins class names, dropping anything falsy.
 *
 * It lives on its own so the UI modules can share it without importing each
 * other: `primitives` needs `StatCard` from `metrics`, and `metrics` needed
 * `cx` from `primitives`, which is a cycle.
 */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
