ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN IF NOT EXISTS "identity_event_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applicant_id" uuid REFERENCES "public"."applicants"("id") ON DELETE cascade,
	"from_status" text,
	"to_status" text,
	"actor" text NOT NULL,
	"reason" text NOT NULL,
	"version" integer
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_events_applicant_idx" ON "application_events" USING btree ("applicant_id","created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"dedupe_key" text NOT NULL UNIQUE,
	"applicant_id" uuid REFERENCES "public"."applicants"("id") ON DELETE cascade,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"lock_token" uuid,
	"first_attempt_at" timestamp with time zone,
	"last_error" text,
	"provider_id" text,
	"delivery_status" text,
	"delivery_event_at" timestamp with time zone
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_due_idx" ON "jobs" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_applicant_idx" ON "jobs" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_provider_idx" ON "jobs" USING btree ("provider_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider" text NOT NULL,
	"event_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"outcome" text
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_key" ON "webhook_events" USING btree ("provider","event_key");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_tokens" (
	"hash" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applicant_id" uuid NOT NULL REFERENCES "public"."applicants"("id") ON DELETE cascade,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_tokens_expiry_idx" ON "access_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_expiry_idx" ON "rate_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_receipts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applicant_id" uuid NOT NULL REFERENCES "public"."applicants"("id") ON DELETE cascade,
	"request_hash" text NOT NULL,
	"result" jsonb NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_clock" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"revision" bigint DEFAULT 0 NOT NULL
);--> statement-breakpoint
INSERT INTO "sync_clock" ("singleton", "revision") VALUES (true, 0) ON CONFLICT DO NOTHING;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_changes" (
	"revision" bigint PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_changes_table_revision_idx" ON "sync_changes" USING btree ("table_name","revision");
