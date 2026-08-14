# ADR 0001: Use Drizzle ORM instead of Prisma

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** Alishba Rehman

## Context

The project brief lists a recommended stack of Next.js, TypeScript, Tailwind CSS,
PostgreSQL and **Prisma**. Every other element of that stack is in use. This
record explains why the ORM differs, so the deviation is a documented decision
rather than an accident.

ProofWork's data model is unusually relational for a project of this size. The
schema already defines 30+ tables with heavy cross-referencing: skill
verification alone spans `candidate_skills`, `assessments`,
`assessment_assignments`, `submissions`, `reviews` and `review_criterion_scores`,
and the recruiter search planned later has to filter candidates by verified
skill, score, availability and location simultaneously.

Two properties therefore mattered more than usual when choosing an ORM:

1. Precise control over the generated SQL, including partial indexes,
   `NULLS LAST` ordering and composite filtering.
2. A migration format that can be reviewed and hand-edited, because several
   migrations need data backfills rather than pure schema changes.

## Decision

Use **Drizzle ORM** with `drizzle-kit` for migrations.

## Rationale

**SQL transparency.** Drizzle queries map almost directly onto SQL, so the query
that runs is the query that was written. Recruiter search will need composite
filters across joined tables; being able to express and read that directly is
worth more here than a higher-level abstraction.

**Editable migrations.** `drizzle-kit` emits plain `.sql` files. This mattered
immediately: migration `0005_candidate_profile_slug.sql` adds a `NOT NULL`
column to a table that already had rows, which required adding the column as
nullable, backfilling every row, and only then applying the constraint. Being
able to hand-write that sequence in the generated file was a direct benefit.

**No separate schema language.** The schema is TypeScript, so table definitions
and inferred row types share one source of truth. `InferSelectModel` gives the
application types (`CandidateProfile`, `EducationItem`) without a generation
step, which keeps types correct after a schema edit without running a codegen
command first.

**Runtime footprint.** Drizzle ships no query engine binary, which keeps
serverless cold starts and deployment size smaller — relevant because the app is
deployed on Next.js server functions.

## Consequences

**Accepted trade-offs:**

- Prisma Studio has no direct equivalent; database inspection uses SQL or the
  Supabase dashboard.
- Prisma's ecosystem and documentation are larger, so there are fewer worked
  examples for uncommon Drizzle problems.
- Drizzle pushes more SQL knowledge onto the developer. This is a cost for
  onboarding, though an acceptable one given the relational complexity above.
- Anyone joining who knows Prisma has a short learning curve.

**Mitigations:**

- Query logic is confined to `src/features/*/server/*.queries.ts` and server
  actions, so the ORM is not spread across the codebase and remains replaceable.
- Migrations are committed as reviewable SQL alongside their snapshots.

## Revisit if

- The team grows and Prisma familiarity becomes the dominant onboarding cost.
- The project requires tooling that only Prisma provides.

At that point the isolation described above should keep the swap contained to
the query and schema layers rather than the whole application.
