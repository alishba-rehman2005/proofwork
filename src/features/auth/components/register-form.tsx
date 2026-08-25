"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { Alert, controlClassName } from "@/components/ui";
import { ArrowRightIcon } from "@/features/auth/components/auth-icons";
import type { AccountType } from "@/features/auth/validation/register.schema";

type FieldErrors = Record<string, string[] | undefined>;

export function RegisterForm() {
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>("CANDIDATE");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRecruiter = accountType === "COMPANY";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    // Checked here as well as on the server so the message lands on the field
    // rather than as a form-level error.
    if (payload.password !== payload.confirmPassword) {
      setErrors({ confirmPassword: ["Passwords do not match."] });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, accountType }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        }

        setFormError(result.message ?? "Registration failed.");
        return;
      }

      if (result.requiresApproval) {
        setPendingMessage(result.message);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setFormError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pendingMessage) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Thanks for registering">
          {pendingMessage}
        </Alert>

        <p className="text-sm text-muted">
          Company accounts are reviewed before the first sign in, because a recruiter can read
          candidate data. You will not be able to sign in until an administrator approves the
          account.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Back to home
          </Link>

          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Jane Doe"
        disabled={isSubmitting}
        error={errors.fullName?.[0]}
      />

      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="jane@example.com"
        disabled={isSubmitting}
        error={errors.email?.[0]}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          error={errors.password?.[0]}
          hint="8+ characters, with upper, lower and a number."
        />

        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          error={errors.confirmPassword?.[0]}
        />
      </div>

      <fieldset className="pt-1">
        <legend className="mb-3 text-sm font-medium">I am joining as a</legend>

        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            label="Candidate"
            selected={!isRecruiter}
            disabled={isSubmitting}
            onClick={() => setAccountType("CANDIDATE")}
            icon={<CandidateIcon />}
          />

          <RoleCard
            label="Recruiter"
            selected={isRecruiter}
            disabled={isSubmitting}
            onClick={() => setAccountType("COMPANY")}
            icon={<RecruiterIcon />}
          />
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <span aria-hidden="true" className="mt-0.5 text-primary">
            <ReviewerIcon />
          </span>

          <span>
            Reviewers and admins are appointed, never self-registered. A reviewer decides what
            becomes verified, so that authority is granted per skill by an administrator.
          </span>
        </p>
      </fieldset>

      {isRecruiter && (
        <div className="grid gap-4 border-s-2 border-primary ps-4 sm:grid-cols-2">
          <Field
            label="Company name"
            name="companyName"
            autoComplete="organization"
            placeholder="Company Ltd."
            disabled={isSubmitting}
            error={errors.companyName?.[0]}
          />

          <Field
            label="Job title"
            name="jobTitle"
            autoComplete="organization-title"
            placeholder="Talent Partner"
            disabled={isSubmitting}
            error={errors.jobTitle?.[0]}
          />

          <div className="sm:col-span-2">
            <Field
              label="Company website"
              name="companyWebsite"
              type="url"
              placeholder="https://company.com"
              disabled={isSubmitting}
              error={errors.companyWebsite?.[0]}
            />
          </div>

          <p className="text-xs text-muted sm:col-span-2">
            Company accounts are reviewed by an administrator before the first sign in.
          </p>
        </div>
      )}

      {formError && <Alert tone="danger">{formError}</Alert>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
        {!isSubmitting && <ArrowRightIcon className="h-5 w-5" />}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
};

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  disabled,
  error,
  hint,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        className={`${controlClassName} h-12`}
      />

      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}

      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type RoleCardProps = {
  label: string;
  icon: ReactNode;
  selected: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
};

function RoleCard({ label, icon, selected, disabled, title, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-24 flex-col items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${
        selected
          ? "border-primary bg-primary-soft text-foreground"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-foreground"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon}
      {label}
    </button>
  );
}

function CandidateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2H5Z" />
    </svg>
  );
}

function ReviewerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 4.5 6v5.2c0 4.5 3.1 7.8 7.5 9.8 4.4-2 7.5-5.3 7.5-9.8V6L12 3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecruiterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}
