"use client";

import { useActionState } from "react";

import { Badge, Button, EmptyState } from "@/components/ui";

import {
  approveCompanyAction,
  rejectCompanyAction,
  type AdminActionState,
} from "../actions/admin.actions";
import type { PendingCompany } from "../server/admin.queries";

const initialState: AdminActionState = {};

export function PendingCompanies({ companies }: { companies: PendingCompany[] }) {
  if (companies.length === 0) {
    return (
      <EmptyState
        title="Nothing awaiting review"
        description="New company registrations will appear here for approval."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {companies.map((company) => (
        <li key={company.companyId}>
          <PendingCompanyRow company={company} />
        </li>
      ))}
    </ul>
  );
}

function PendingCompanyRow({ company }: { company: PendingCompany }) {
  // Each row owns its state so one decision's message cannot appear against a
  // different company in the queue.
  const [state, action, pending] = useActionState(approveCompanyAction, initialState);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectCompanyAction, initialState);

  const busy = pending || rejecting;
  const message = state.message ?? rejectState.message;
  const succeeded = state.success ?? rejectState.success;

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{company.companyName}</p>

            <Badge tone="warning">Pending</Badge>
          </div>

          <p className="mt-1 text-sm text-muted">
            {company.ownerEmail}
            {company.ownerJobTitle && ` · ${company.ownerJobTitle}`}
          </p>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-block text-sm text-primary underline"
            >
              {company.website}
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={action}>
            <input type="hidden" name="companyId" value={company.companyId} />

            <Button type="submit" disabled={busy}>
              {pending ? "Approving..." : "Approve"}
            </Button>
          </form>

          <form action={rejectAction}>
            <input type="hidden" name="companyId" value={company.companyId} />

            <Button type="submit" variant="danger" disabled={busy}>
              {rejecting ? "Rejecting..." : "Reject"}
            </Button>
          </form>
        </div>
      </div>

      {message && (
        <p role="status" className={`mt-3 text-sm ${succeeded ? "text-success" : "text-danger"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
