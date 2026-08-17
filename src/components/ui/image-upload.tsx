"use client";

import { useState, type ChangeEvent } from "react";

import { controlClassName } from "./form";

/**
 * Image field that accepts either a pasted URL or a file upload.
 *
 * The URL input is always the source of truth and is what gets submitted, so
 * the field still works when storage is unconfigured - uploading is a
 * convenience layered on top, never the only way in.
 */
export function ImageUploadField({
  label,
  name,
  purpose,
  defaultValue = "",
  hint,
  error,
  disabled,
}: {
  label: string;
  name: string;
  purpose: "project-image" | "submission-screenshot";
  defaultValue?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);
    setBusy(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", purpose);

      const response = await fetch("/api/upload", { method: "POST", body });
      const result = await response.json();

      if (!response.ok) {
        setUploadError(result.message ?? "Upload failed.");
        return;
      }

      setUrl(result.url);
    } catch {
      setUploadError("Unable to reach the server.");
    } finally {
      setBusy(false);
      // Clear so choosing the same file again still fires a change.
      input.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        disabled={disabled || busy}
        placeholder="https://example.com/image.png"
        className={`${controlClassName} mt-2`}
      />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled || busy}
          onChange={handleFile}
          aria-label={`Upload an image for ${label}`}
          className="text-xs text-muted file:me-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium"
        />

        {busy && <span className="text-xs text-muted">Uploading...</span>}
      </div>

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="mt-3 h-24 w-40 rounded-lg border border-line object-cover"
        />
      )}

      {hint && !error && !uploadError && <p className="mt-1 text-xs text-muted">{hint}</p>}

      {(error || uploadError) && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error ?? uploadError}
        </p>
      )}
    </div>
  );
}
