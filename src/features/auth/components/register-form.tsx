"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ACCOUNT_TYPES, type AccountType } from "@/features/auth/validation/register.schema";

type FieldErrors = Record<string, string[] | undefined>;

const ACCOUNT_TYPE_COPY: Record<AccountType, { label: string; hint: string }> = {
  CANDIDATE: {
    label: "I'm a candidate",
    hint: "Build a profile and get your skills verified.",
  },
  COMPANY: {
    label: "I'm hiring",
    hint: "Discover candidates with verified skills.",
  },
};

export function RegisterForm() {
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>("CANDIDATE");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompany = accountType === "COMPANY";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

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

      // A company account cannot sign in until an admin approves it, so
      // sending it to the login page would be a dead end.
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
      <div role="status" className="rounded-xl border border-info/40 bg-info-soft p-5 text-center">
        <p className="font-medium">Thanks for registering</p>

        <p className="mt-2 text-sm text-muted">{pendingMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">I am joining as</legend>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map((type) => {
            const selected = accountType === type;

            return (
              <label
                key={type}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  selected ? "border-primary bg-primary-soft" : "border-line hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="accountTypeChoice"
                  value={type}
                  checked={selected}
                  onChange={() => setAccountType(type)}
                  disabled={isSubmitting}
                  className="sr-only"
                />

                <span className={`block font-medium ${selected ? "text-primary" : ""}`}>
                  {ACCOUNT_TYPE_COPY[type].label}
                </span>

                <span className="mt-1 block text-xs text-muted">
                  {ACCOUNT_TYPE_COPY[type].hint}
                </span>
              </label>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-muted">
          Reviewers are appointed by an administrator and cannot register here.
        </p>
      </fieldset>

      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Your full name"
        disabled={isSubmitting}
        error={errors.fullName?.[0]}
      />

      {isCompany && (
        <>
          <Field
            label="Company name"
            name="companyName"
            autoComplete="organization"
            placeholder="Example Inc."
            disabled={isSubmitting}
            error={errors.companyName?.[0]}
          />

          <Field
            label="Your job title"
            name="jobTitle"
            autoComplete="organization-title"
            placeholder="Talent Partner (optional)"
            disabled={isSubmitting}
            error={errors.jobTitle?.[0]}
          />

          <Field
            label="Company website"
            name="companyWebsite"
            type="url"
            placeholder="https://example.com (optional)"
            disabled={isSubmitting}
            error={errors.companyWebsite?.[0]}
          />
        </>
      )}

      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        disabled={isSubmitting}
        error={errors.email?.[0]}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        disabled={isSubmitting}
        error={errors.password?.[0]}
      />

      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        disabled={isSubmitting}
        error={errors.confirmPassword?.[0]}
      />

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger"
        >
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      {isCompany && (
        <p className="text-center text-xs text-muted">
          Company accounts are reviewed by an administrator before they can sign in.
        </p>
      )}
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
};

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  disabled,
  error,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        defaultValue=""
        className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-primary disabled:bg-surface-muted"
      />

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
