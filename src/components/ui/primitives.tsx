import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Card */

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      {...props}
      className={cx("rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6", className)}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2 {...props} className={cx("text-base font-semibold tracking-tight sm:text-lg", className)} />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cx("text-sm text-muted", className)} />;
}

/* ------------------------------------------------------------ PageHeader */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {breadcrumb}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>

          {description && <p className="mt-2 text-muted">{description}</p>}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}

            {index < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ----------------------------------------------------------------- Badge */

export type BadgeTone =
  "neutral" | "solid" | "outline" | "success" | "warning" | "danger" | "info" | "accent";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  solid: "bg-primary text-primary-foreground",
  outline: "border border-line-strong text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  // Work in flight: assigned or under way, but not yet judged.
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    />
  );
}

/* ---------------------------------------------------------------- Button */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm",
  secondary:
    "border border-line bg-surface text-foreground shadow-xs hover:border-line-strong hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      {...props}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      {...props}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    />
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="font-medium">{title}</p>

      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>}

      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Alert */

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-info/30 bg-info-soft text-info",
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-danger/30 bg-danger-soft text-danger",
  } as const;

  return (
    <div role="status" className={cx("rounded-lg border p-3 text-sm", tones[tone])}>
      {title && <p className="font-medium">{title}</p>}

      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- Skeleton */

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cx("animate-pulse rounded-md bg-surface-muted", className)}
    />
  );
}

/* ----------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  label,
  tone = "primary",
}: {
  value: number;
  label: string;
  tone?: "primary" | "success" | "danger";
}) {
  const fills = {
    primary: "bg-primary",
    success: "bg-success",
    danger: "bg-danger",
  } as const;

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx("h-full rounded-full transition-all", fills[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Stat */

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>

      <p className="tabular mt-1 text-2xl font-semibold">{value}</p>

      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- Separator */

export function Separator({ className }: { className?: string }) {
  return <hr className={cx("border-line", className)} />;
}

/* ---------------------------------------------------------------- Avatar */

export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-muted text-sm font-medium text-muted"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
