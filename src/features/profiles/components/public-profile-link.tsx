"use client";

import { useState } from "react";

type PublicProfileLinkProps = {
  path: string;
  description: string;
  isShareable: boolean;
};

/**
 * Shows the candidate's public profile URL with a copy button.
 *
 * The absolute URL is built in the browser so it matches whichever host the
 * app is actually served from, rather than needing a configured base URL.
 */
export function PublicProfileLink({ path, description, isShareable }: PublicProfileLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded bg-slate-100 px-2 py-1 text-sm break-all">{path}</code>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition-colors hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy link"}
        </button>

        <a
          href={path}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-blue-600 underline"
        >
          Preview
        </a>
      </div>

      <p className="mt-3 text-sm text-slate-600">{description}</p>

      {!isShareable && (
        <p className="mt-1 text-sm text-amber-700">
          Set visibility to Public if you want to share this link openly.
        </p>
      )}
    </div>
  );
}
