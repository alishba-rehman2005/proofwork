-- Add the public profile slug.
--
-- Generated as a nullable column first: existing rows need a value before the
-- NOT NULL constraint can be applied. The backfill mirrors the application's
-- slug builder (slugified full name + a short id suffix for uniqueness).

ALTER TABLE "candidate_profiles" ADD COLUMN "slug" text;--> statement-breakpoint

UPDATE "candidate_profiles"
SET "slug" =
  COALESCE(
    NULLIF(trim(both '-' from regexp_replace(lower("full_name"), '[^a-z0-9]+', '-', 'g')), ''),
    'candidate'
  )
  || '-' || substr(replace("id"::text, '-', ''), 1, 8)
WHERE "slug" IS NULL;--> statement-breakpoint

ALTER TABLE "candidate_profiles" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_slug_unique" UNIQUE("slug");
