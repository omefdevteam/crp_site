CREATE TYPE "public"."age_group" AS ENUM('under_19', '19_plus');--> statement-breakpoint
CREATE TYPE "public"."applicant_status" AS ENUM('submitted', 'round1_complete', 'accepted', 'rejected', 'interview_yes', 'interview_no', 'docs_submitted', 'onboarding', 'online', 'ineligible');--> statement-breakpoint
CREATE TYPE "public"."interview_outcome" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."nomination_status" AS ENUM('new', 'invited', 'applied', 'declined');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('accept', 'reject');--> statement-breakpoint
CREATE TYPE "public"."track" AS ENUM('in_person', 'online');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"dob" date NOT NULL,
	"age" integer NOT NULL,
	"track" "track" NOT NULL,
	"status" "applicant_status" DEFAULT 'submitted' NOT NULL,
	"round1_link" text,
	"round1_completed_at" timestamp with time zone,
	"interview_at" timestamp with time zone,
	"docs_status" text,
	"review_decision" "review_decision",
	"review_notes" text,
	"reviewer" text,
	"review_date" timestamp with time zone,
	"interview_outcome" "interview_outcome",
	"interview_notes" text,
	"interview_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consent_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"age_group" "age_group" NOT NULL,
	"track" "track",
	"source" text
);
--> statement-breakpoint
CREATE TABLE "nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"nominator_name" text NOT NULL,
	"nominator_email" text NOT NULL,
	"nominee_name" text NOT NULL,
	"nominee_email" text NOT NULL,
	"nominee_location" text,
	"videoask_link" text,
	"status" "nomination_status" DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"source" text,
	"status" "waitlist_status" DEFAULT 'subscribed' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applicants_email_key" ON "applicants" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "interest_email_key" ON "interest" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "nominations_pair_key" ON "nominations" USING btree ("nominator_email","nominee_email");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist" USING btree ("email");