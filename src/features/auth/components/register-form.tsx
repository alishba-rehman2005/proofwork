"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RegisterErrors = {
  fullName?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
};

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        }

        setFormError(result.message ?? "Registration failed.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setFormError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>

        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Your full name"
        />

        {errors.fullName?.[0] && <p className="text-sm text-danger">{errors.fullName[0]}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="you@example.com"
        />

        {errors.email?.[0] && <p className="text-sm text-danger">{errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Create a strong password"
        />

        {errors.password?.[0] && <p className="text-sm text-danger">{errors.password[0]}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Repeat your password"
        />

        {errors.confirmPassword?.[0] && (
          <p className="text-sm text-danger">{errors.confirmPassword[0]}</p>
        )}
      </div>

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
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
