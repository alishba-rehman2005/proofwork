CREATE TYPE "public"."activity_type" AS ENUM('SKILL_ADDED', 'SKILL_VERIFIED', 'ASSESSMENT_STARTED', 'ASSESSMENT_SUBMITTED', 'ASSESSMENT_COMPLETED', 'REVIEW_RECEIVED', 'PROJECT_CREATED', 'PROJECT_VERIFIED', 'TEAM_JOINED', 'TEAM_CONTRIBUTION_ADDED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('ASSESSMENT_ASSIGNED', 'DEADLINE_APPROACHING', 'SUBMISSION_RECEIVED', 'CHANGES_REQUESTED', 'ASSESSMENT_APPROVED', 'SKILL_VERIFIED', 'SKILL_REJECTED', 'REVIEW_ASSIGNED', 'TEAM_INVITATION', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."skill_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."verification_request_status" AS ENUM('PENDING', 'ASSESSMENT_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewer_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"granted_by_id" uuid,
	"can_verify" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"skill_id" uuid,
	"proposed_name" text NOT NULL,
	"description" text,
	"status" "skill_request_status" DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"candidate_skill_id" uuid NOT NULL,
	"status" "verification_request_status" DEFAULT 'PENDING' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_skills" ADD CONSTRAINT "reviewer_skills_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_skills" ADD CONSTRAINT "reviewer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_skills" ADD CONSTRAINT "reviewer_skills_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_candidate_skill_id_candidate_skills_id_fk" FOREIGN KEY ("candidate_skill_id") REFERENCES "public"."candidate_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_candidate_created_idx" ON "activity_events" USING btree ("candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_events_type_idx" ON "activity_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviewer_skills_reviewer_skill_unique" ON "reviewer_skills" USING btree ("reviewer_id","skill_id");--> statement-breakpoint
CREATE INDEX "reviewer_skills_skill_id_idx" ON "reviewer_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_requests_status_idx" ON "skill_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skill_requests_requested_by_idx" ON "skill_requests" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "verification_requests_status_idx" ON "verification_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_requests_candidate_idx" ON "verification_requests" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "verification_requests_candidate_skill_idx" ON "verification_requests" USING btree ("candidate_skill_id");