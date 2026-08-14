CREATE TYPE "public"."account_status" AS ENUM('PENDING', 'ACTIVE', 'DISABLED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'OPEN_TO_OPPORTUNITIES', 'NOT_AVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('PRIVATE', 'RECRUITERS_ONLY', 'PUBLIC');--> statement-breakpoint
CREATE TYPE "public"."skill_verification_status" AS ENUM('UNVERIFIED', 'ASSESSMENT_ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"headline" text,
	"bio" text,
	"profile_image_url" text,
	"location" text,
	"country" text,
	"city" text,
	"availability" "availability_status",
	"profile_visibility" "profile_visibility" DEFAULT 'RECRUITERS_ONLY' NOT NULL,
	"github_url" text,
	"portfolio_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"experience_level" "experience_level" NOT NULL,
	"verification_status" "skill_verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"current_score" numeric(5, 2),
	"verified_at" timestamp with time zone,
	"verified_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "skill_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name"),
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"image" text,
	"account_status" "account_status" DEFAULT 'PENDING' NOT NULL,
	"primary_role_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_primary_role_id_roles_id_fk" FOREIGN KEY ("primary_role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_profiles_availability_idx" ON "candidate_profiles" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "candidate_profiles_country_city_idx" ON "candidate_profiles" USING btree ("country","city");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_skills_candidate_skill_unique" ON "candidate_skills" USING btree ("candidate_id","skill_id");--> statement-breakpoint
CREATE INDEX "candidate_skills_skill_status_idx" ON "candidate_skills" USING btree ("skill_id","verification_status");--> statement-breakpoint
CREATE INDEX "candidate_skills_candidate_status_idx" ON "candidate_skills" USING btree ("candidate_id","verification_status");--> statement-breakpoint
CREATE INDEX "candidate_skills_current_score_idx" ON "candidate_skills" USING btree ("current_score");--> statement-breakpoint
CREATE INDEX "skills_category_id_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "skills_is_active_idx" ON "skills" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_unique" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_account_status_idx" ON "users" USING btree ("account_status");