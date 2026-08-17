import type { Metadata } from "next";

import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import {
  getLeaderboard,
  getLeaderboardCategories,
  getMostActiveCandidates,
} from "@/features/activity/activity";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireUser();

  const { category } = await searchParams;

  const [rows, categories, active] = await Promise.all([
    getLeaderboard(25, category),
    getLeaderboardCategories(),
    getMostActiveCandidates(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Ranked on verified skills and reviewed assessment scores."
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              {category
                ? (categories.find((item) => item.slug === category)?.name ?? "Category")
                : "Overall"}
            </CardTitle>

            <CardDescription>
              Proven work only. Activity volume does not move anyone up this table.
            </CardDescription>
          </div>
        </div>

        {/* Category tabs, rendered as links so the board stays server-rendered. */}
        <nav className="flex flex-wrap gap-2" aria-label="Leaderboard categories">
          <ButtonLink href="/leaderboard" size="sm" variant={category ? "secondary" : "primary"}>
            Overall
          </ButtonLink>

          {categories.map((item) => (
            <ButtonLink
              key={item.slug}
              href={`/leaderboard?category=${item.slug}`}
              size="sm"
              variant={category === item.slug ? "primary" : "secondary"}
            >
              {item.name}
            </ButtonLink>
          ))}
        </nav>

        {rows.length === 0 ? (
          <EmptyState
            title="Nothing ranked yet"
            description="Once assessments are reviewed and approved, candidates will appear here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="w-12">#</TH>
                <TH>Candidate</TH>
                <TH className="text-right">Verified skills</TH>
                <TH className="text-right">Average score</TH>
                <TH className="text-right">Verified projects</TH>
                <TH />
              </TR>
            </THead>

            <TBody>
              {rows.map((row, index) => (
                <TR key={row.candidateId}>
                  <TD className="tabular text-muted">{index + 1}</TD>

                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar src={row.profileImageUrl} name={row.fullName} size={32} />

                      <div className="min-w-0">
                        <p className="font-medium">{row.fullName}</p>

                        {row.headline && (
                          <p className="truncate text-xs text-muted">{row.headline}</p>
                        )}
                      </div>
                    </div>
                  </TD>

                  <TD className="text-right">
                    <Badge tone="solid">{row.verifiedSkills}</Badge>
                  </TD>

                  <TD className="tabular text-right">{row.averageScore}%</TD>

                  <TD className="tabular text-right">{row.verifiedProjects}</TD>

                  <TD>
                    <div className="flex justify-end">
                      <ButtonLink href={`/candidates/${row.slug}`} variant="ghost" size="sm">
                        View
                      </ButtonLink>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Most active</CardTitle>

          <CardDescription>
            Recorded activity, shown separately because effort is not the same as proven ability.
          </CardDescription>
        </div>

        {active.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {active.map((row, index) => (
              <li key={row.candidateId} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="tabular w-6 text-sm text-muted">{index + 1}</span>

                  <span className="font-medium">{row.fullName}</span>
                </div>

                <span className="tabular text-sm text-muted">{row.events} events</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
