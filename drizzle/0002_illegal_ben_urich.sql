CREATE TYPE "public"."identity_status" AS ENUM('pending', 'verified', 'failed', 'review');--> statement-breakpoint
ALTER TYPE "public"."applicant_status" ADD VALUE 'id_verified';--> statement-breakpoint
ALTER TYPE "public"."applicant_status" ADD VALUE 'id_failed';--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "identity_status" "identity_status";--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "identity_session_id" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "identity_link" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "identity_checked_at" timestamp with time zone;