import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  PageHeader,
} from "@/components/ui";
import { getAccountDetails } from "@/features/account/account";
import {
  AccountDetailsForm,
  PasswordChangeForm,
} from "@/features/account/components/account-forms";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const user = await requireUser();

  const account = await getAccountDetails(user.id);

  if (!account) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Account"
        description="Settings for your sign-in and how you appear across ProofWork."
        actions={
          account.candidateSlug ? (
            <ButtonLink href="/profile" variant="secondary">
              Public profile
            </ButtonLink>
          ) : undefined
        }
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Details</CardTitle>

            <CardDescription>{account.email}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {account.roleNames.map((role) => (
              <Badge key={role} tone="accent">
                {role.toLowerCase()}
              </Badge>
            ))}

            <Badge tone={account.accountStatus === "ACTIVE" ? "success" : "warning"}>
              {account.accountStatus.toLowerCase()}
            </Badge>
          </div>
        </div>

        <AccountDetailsForm name={account.name ?? ""} />

        <p className="border-t border-line pt-4 text-xs text-muted">
          Member since {formatDate(account.createdAt)}. Your email address is used to sign in and
          cannot be changed here.
        </p>
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Password</CardTitle>

          <CardDescription>
            Changing your password does not sign you out of this device.
          </CardDescription>
        </div>

        {account.hasPassword ? (
          <PasswordChangeForm />
        ) : (
          <Alert tone="info">
            This account signs in with a connected provider, so there is no password to change.
          </Alert>
        )}
      </Card>
    </div>
  );
}
