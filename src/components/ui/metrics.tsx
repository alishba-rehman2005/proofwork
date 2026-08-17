import type { ReactNode } from "react";

import { cx } from "./primitives";

/*
|--------------------------------------------------------------------------
| METRIC DISPLAYS
|--------------------------------------------------------------------------
| Denser read-only widgets for the dashboard and skills pages. All of them
| use theme tokens, so the same markup carries light and dark.
*/

/* -------------------------------------------------------------- StatCard */

const STAT_TONES = {
  neutral: "bg-surface-muted text-muted",
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  tone = "neutral",
  children,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  /** Rendered with an upward marker; use for month-on-month movement. */
  trend?: string;
  /** Tints the icon tile so the card reads even with no data behind it. */
  tone?: keyof typeof STAT_TONES;
  children?: ReactNode;
}) {
  return (
    <div className="lift rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>

        {icon && (
          <span
            className={cx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              STAT_TONES[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p className="tabular mt-3 text-3xl font-semibold">{value}</p>

      {trend && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
          <TrendIcon />
          {trend}
        </p>
      )}

      {hint && !trend && <p className="mt-2 text-xs text-muted">{hint}</p>}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function TrendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

/* ------------------------------------------------------------- ScoreMeter */

/**
 * One row of the verification overview: skill, state, score and a bar.
 *
 * An unscored skill still renders its track so the list keeps a steady rhythm
 * instead of collapsing where the data is missing.
 */
export function ScoreMeter({
  label,
  score,
  maximum = 100,
  badge,
  caption,
  tone = "primary",
}: {
  label: string;
  score: number | null;
  maximum?: number;
  badge?: ReactNode;
  caption?: string;
  /** Match the bar to the state it represents. */
  tone?: "primary" | "success" | "accent";
}) {
  const percentage = score === null ? 0 : Math.min(100, Math.round((score / maximum) * 100));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {badge}
        </span>

        <span className="tabular text-sm text-muted">
          {score === null ? "—" : `${Math.round(score)}`}/{maximum}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} score`}
      >
        <div
          className={cx(
            "h-full rounded-full transition-all duration-500",
            score === null
              ? "bg-line-strong"
              : tone === "success"
                ? "bg-success"
                : tone === "accent"
                  ? "bg-accent"
                  : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {caption && <p className="mt-1.5 text-xs text-muted">{caption}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ SegmentBar */

const LEVEL_SEGMENTS: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

/** Discrete confidence indicator, four segments wide. */
export function SegmentBar({
  level,
  muted = false,
  tone = "success",
}: {
  level: string;
  muted?: boolean;
  tone?: "success" | "accent" | "primary";
}) {
  const filled = LEVEL_SEGMENTS[level] ?? 0;
  const fill = muted
    ? "bg-line-strong"
    : tone === "accent"
      ? "bg-accent"
      : tone === "primary"
        ? "bg-primary"
        : "bg-success";

  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`Experience level: ${level.toLowerCase()}`}
    >
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={cx("h-1.5 w-5 rounded-sm", index < filled ? fill : "bg-surface-muted")}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------- ActivityGrid */

/**
 * Contribution-style grid of daily activity.
 *
 * Intensity is bucketed rather than scaled to the maximum, so one unusually
 * busy day cannot wash out the rest of the grid.
 */
export function ActivityGrid({ days }: { days: { date: string; count: number }[] }) {
  const intensity = (count: number) => {
    if (count === 0) return "bg-surface-muted";
    if (count === 1) return "bg-success/30";
    if (count <= 3) return "bg-success/60";
    return "bg-success";
  };

  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label="Daily verification activity">
      {days.map((day) => (
        <span
          key={day.date}
          title={`${day.date}: ${day.count} event${day.count === 1 ? "" : "s"}`}
          className={cx("h-3.5 w-3.5 rounded-sm", intensity(day.count))}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- TimelineList */

export function TimelineList({
  items,
}: {
  items: { id: string; title: string; body?: string; timestamp: string; emphasis?: boolean }[];
}) {
  return (
    <ol className="relative space-y-5 border-s border-line ps-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className={cx(
              "absolute -start-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface",
              item.emphasis ? "bg-primary" : "bg-line-strong",
            )}
          />

          <p className="text-xs text-faint">{item.timestamp}</p>

          <p className="mt-0.5 text-sm font-medium">{item.title}</p>

          {item.body && <p className="mt-0.5 text-sm text-muted">{item.body}</p>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ QuoteBlock */

/** Reviewer feedback, presented as a quotation rather than body copy. */
export function QuoteBlock({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <figure className="rounded-lg border-s-2 border-line-strong bg-surface-muted p-3">
      {label && (
        <figcaption className="text-[11px] font-semibold tracking-wider text-muted uppercase">
          {label}
        </figcaption>
      )}

      <blockquote className={cx("text-sm text-foreground", label && "mt-1.5")}>
        {children}
      </blockquote>
    </figure>
  );
}
