"use client";

import type { ReactNode } from "react";

/**
 * Shared presentational form primitives for the profile feature.
 *
 * Keeping the markup in one place means every profile form renders labels,
 * validation errors, and buttons identically.
 */

const controlClassName =
  "mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:bg-surface-muted";

type FieldShellProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

function FieldShell({ label, htmlFor, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>

      {children}

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  type?: "text" | "url" | "email" | "date";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export function TextField({
  label,
  name,
  defaultValue = "",
  type = "text",
  placeholder,
  required,
  disabled,
  error,
}: TextFieldProps) {
  return (
    <FieldShell label={label} htmlFor={name} error={error}>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        className={controlClassName}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  disabled?: boolean;
  error?: string;
};

export function TextAreaField({
  label,
  name,
  defaultValue = "",
  rows = 4,
  disabled,
  error,
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} htmlFor={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        disabled={disabled}
        defaultValue={defaultValue}
        className={controlClassName}
      />
    </FieldShell>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue = "",
  disabled,
  error,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} htmlFor={name} error={error}>
      {/*
        React resets the form once the action completes, and a reset reverts a
        <select> to the option marked selected at mount - not to the current
        defaultValue, the way a text input does. Keying on defaultValue remounts
        the select whenever the saved value changes, so the post-save default is
        the correct one and the reset lands on it. Without this the field snaps
        back to its old value and the next save persists that stale value.
      */}
      <select
        key={defaultValue}
        id={name}
        name={name}
        disabled={disabled}
        defaultValue={defaultValue}
        className={controlClassName}
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

type CheckboxFieldProps = {
  label: string;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
};

export function CheckboxField({ label, name, defaultChecked, disabled }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
      <input
        id={name}
        name={name}
        type="checkbox"
        disabled={disabled}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-line"
      />

      {label}
    </label>
  );
}

type FormStatusProps = {
  success?: boolean;
  message?: string;
};

export function FormStatus({ success, message }: FormStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <p role="status" className={success ? "text-sm text-success" : "text-sm text-danger"}>
      {message}
    </p>
  );
}

type SubmitButtonProps = {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
};

export function SubmitButton({ pending, idleLabel, pendingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
