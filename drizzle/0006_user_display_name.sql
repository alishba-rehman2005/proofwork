-- Give every account a display name, not just candidates.
--
-- Until now only candidate_profiles carried a name, so reviewers, recruiters
-- and admins were rendered as bare email addresses everywhere they appeared.

ALTER TABLE "users" ADD COLUMN "name" text;--> statement-breakpoint

-- Candidates already have a name; reuse it rather than asking again.
UPDATE "users" u
SET "name" = cp."full_name"
FROM "candidate_profiles" cp
WHERE cp."user_id" = u."id" AND u."name" IS NULL;--> statement-breakpoint

-- Everyone else gets a readable placeholder derived from their address, so no
-- screen has to fall back to showing an email as a person's name.
UPDATE "users"
SET "name" = initcap(replace(replace(split_part("email", '@', 1), '.', ' '), '-', ' '))
WHERE "name" IS NULL;
