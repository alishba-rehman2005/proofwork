"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

type AvatarUploadProps = {
  currentImageUrl: string | null;
};

export function AvatarUpload({ currentImageUrl }: AvatarUploadProps) {
  const router = useRouter();

  const [preview, setPreview] = useState(currentImageUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setBusy(true);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Upload failed.");
        setPreview(currentImageUrl);

        return;
      }

      setPreview(result.imageUrl);
      router.refresh();
    } catch {
      setError("Unable to upload the image.");
      setPreview(currentImageUrl);
    } finally {
      URL.revokeObjectURL(localUrl);
      setBusy(false);
      // Clear the input so re-selecting the same file fires another change.
      input.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });

      if (!response.ok) {
        const result = await response.json();
        setError(result.message ?? "Unable to remove the image.");

        return;
      }

      setPreview(null);
      router.refresh();
    } catch {
      setError("Unable to remove the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={handleChange}
          className="text-sm"
        />

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Remove photo
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">JPG, PNG or WebP. Maximum 2MB.</p>

      {busy && <p className="text-sm text-slate-600">Working...</p>}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
