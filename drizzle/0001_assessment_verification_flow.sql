CREATE TYPE "public"."assessment_difficulty" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('GITHUB_REPOSITORY', 'LIVE_DEPLOYMENT', 'FIGMA_URL', 'SCREENSHOT', 'DOCUMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."review_outcome" AS ENUM('CHANGES_REQUESTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "assessment_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"candidate_skill_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"assigned_by_id" uuid NOT NULL,
	"status" "assignment_status" DEFAULT 'ASSIGNED' NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"resource_type" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "assessment_difficulty" NOT NULL,
	"requirements" text NOT NULL,
	"submission_instructions" text NOT NULL,
	"maximum_score" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"estimated_duration_minutes" integer,
	"status" "assessment_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"published_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_criterion_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"rubric_criterion_id" uuid NOT NULL,
	"score" numeric(6, 2) NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"outcome" "review_outcome" NOT NULL,
	"total_score" numeric(6, 2) NOT NULL,
	"candidate_feedback" text NOT NULL,
	"internal_notes" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "rubric_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"maximum_points" numeric(6, 2) NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"type" "evidence_type" NOT NULL,
	"title" text,
	"url" text,
	"storage_key" text,
	"mime_type" text,
	"file_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"notes" text,
	"status" "submission_status" DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_candidate_skill_id_candidate_skills_id_fk" FOREIGN KEY ("candidate_skill_id") REFERENCES "public"."candidate_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_resources" ADD CONSTRAINT "assessment_resources_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_skills" ADD CONSTRAINT "assessment_skills_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_skills" ADD CONSTRAINT "assessment_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_criterion_scores" ADD CONSTRAINT "review_criterion_scores_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_criterion_scores" ADD CONSTRAINT "review_criterion_scores_rubric_criterion_id_rubric_criteria_id_fk" FOREIGN KEY ("rubric_criterion_id") REFERENCES "public"."rubric_criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_evidence" ADD CONSTRAINT "submission_evidence_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assessment_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assessment_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_assignments_candidate_skill_idx" ON "assessment_assignments" USING btree ("candidate_skill_id");--> statement-breakpoint
CREATE INDEX "assessment_assignments_assessment_idx" ON "assessment_assignments" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_assignments_reviewer_status_idx" ON "assessment_assignments" USING btree ("reviewer_id","status");--> statement-breakpoint
CREATE INDEX "assessment_assignments_status_deadline_idx" ON "assessment_assignments" USING btree ("status","deadline");--> statement-breakpoint
CREATE INDEX "assessment_resources_assessment_id_idx" ON "assessment_resources" USING btree ("assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_skills_assessment_skill_unique" ON "assessment_skills" USING btree ("assessment_id","skill_id");--> statement-breakpoint
CREATE INDEX "assessment_skills_skill_id_idx" ON "assessment_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "assessments_status_idx" ON "assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessments_difficulty_idx" ON "assessments" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "assessments_created_by_idx" ON "assessments" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_criterion_scores_review_criterion_unique" ON "review_criterion_scores" USING btree ("review_id","rubric_criterion_id");--> statement-breakpoint
CREATE INDEX "review_criterion_scores_criterion_idx" ON "review_criterion_scores" USING btree ("rubric_criterion_id");--> statement-breakpoint
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "reviews_outcome_idx" ON "reviews" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "rubric_criteria_assessment_id_idx" ON "rubric_criteria" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "submission_evidence_submission_id_idx" ON "submission_evidence" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_assignment_attempt_unique" ON "submissions" USING btree ("assignment_id","attempt_number");--> statement-breakpoint
CREATE INDEX "submissions_assignment_status_idx" ON "submissions" USING btree ("assignment_id","status");--> statement-breakpoint
CREATE INDEX "submissions_submitted_at_idx" ON "submissions" USING btree ("submitted_at");