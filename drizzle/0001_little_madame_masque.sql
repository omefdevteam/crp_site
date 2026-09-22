CREATE TYPE "public"."app_language" AS ENUM('en', 'fr');--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "language" "app_language" DEFAULT 'en' NOT NULL;