CREATE TYPE "public"."social_platform" AS ENUM('LINKEDIN', 'GITHUB', 'PORTFOLIO', 'BEHANCE', 'DRIBBBLE', 'WEBSITE', 'OTHER');--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"institution" text NOT NULL,
	"degree" text,
	"field_of_study" text,
	"start_date" date,
	"end_date" date,
	"currently_studying" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company" text NOT NULL,
	"job_title" text NOT NULL,
	"employment_type" text,
	"location" text,
	"start_date" date,
	"end_date" date,
	"currently_working" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "profile_image_storage_path" text;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "education_candidate_id_idx" ON "education" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "experience_candidate_id_idx" ON "experience" USING btree ("candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_links_candidate_platform_unique" ON "social_links" USING btree ("candidate_id","platform");--> statement-breakpoint
CREATE INDEX "social_links_candidate_id_idx" ON "social_links" USING btree ("candidate_id");