ALTER TABLE "applicants" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "capture_tokens" (
  "hash" text PRIMARY KEY NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "kind" text NOT NULL, "payload" jsonb NOT NULL, "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "capture_tokens_expiry_idx" ON "capture_tokens" ("expires_at");
--> statement-breakpoint
-- Do not distribute private form references through the review workbook feed.
UPDATE sync_changes SET payload = payload - 'round1Link' WHERE table_name = 'applicants';
