import type { ComponentProps, ReactNode } from "react";

import { cx } from "./primitives";

export const controlClassName =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-faint focus:border-line-strong disabled:bg-surface-muted disabled:text-muted";

/* ------------------------------------------------------------ FieldShell */

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-muted">
            *
          </span>
        )}
      </label>

      <div className="mt-2">{children}</div>

      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}

      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Input */

export function TextField({
  label,
  name,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; hint?: string; error?: string }) {
  return (
    <FieldShell label={label} htmlFor={name} hint={hint} error={error} required={props.required}>
      <input {...props} id={name} name={name} className={cx(controlClassName, className)} />
    </FieldShell>
  );
}

/* -------------------------------------------------------------- Textarea */

export function TextAreaField({
  label,
  name,
  hint,
  error,
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea"> & { label: string; name: string; hint?: string; error?: string }) {
  return (
    <FieldShell label={label} htmlFor={name} hint={hint} error={error} required={props.required}>
      <textarea
        {...props}
        id={name}
        name={name}
        rows={rows}
        className={cx(controlClassName, className)}
      />
    </FieldShell>
  );
}

/* ---------------------------------------------------------------- Select */

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  name,
  options,
  hint,
  error,
  defaultValue,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children"> & {
  label: string;
  name: string;
  options: readonly SelectOption[];
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={name} hint={hint} error={error} required={props.required}>
      {/*
        Keyed on defaultValue so the element remounts when the saved value
        changes. React resets a form after an action completes, and a reset
        reverts a select to the option selected at mount rather than the
        refreshed one, which silently discards the saved value.
      */}
      <select
        {...props}
        key={String(defaultValue)}
        id={name}
        name={name}
        defaultValue={defaultValue}
        className={cx(controlClassName, className)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/* -------------------------------------------------------------- Checkbox */

export function CheckboxField({
  label,
  name,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; hint?: string }) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm font-medium">
        <input
          {...props}
          id={name}
          name={name}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-line accent-current"
        />

        <span>
          {label}
          {hint && <span className="mt-0.5 block text-xs font-normal text-muted">{hint}</span>}
        </span>
      </label>
    </div>
  );
}

/* ---------------------------------------------------------- SubmitButton */

export function SubmitButton({
  pending,
  idleLabel,
  pendingLabel,
  variant = "primary",
}: {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary-hover"
      : "border border-line bg-surface hover:bg-surface-muted";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles,
      )}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

/* ------------------------------------------------------------ FormStatus */

export function FormStatus({ success, message }: { success?: boolean; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p role="status" className={cx("text-sm", success ? "text-success" : "text-danger")}>
      {message}
    </p>
  );
}
