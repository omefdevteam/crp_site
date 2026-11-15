-- Repeat entries: the same person sending the same form for the same purpose
-- more than once (a second email address, a double-click, a resent message).
-- Apply by hand. Do not run drizzle-kit migrate or drizzle-kit push.
-- The journal and __drizzle_migrations are out of sync, so this file is the
-- source the maintainer runs. Every statement is additive and uses IF NOT EXISTS.
--
-- A scan (lib/duplicates) suggests pairs. Staff confirm or dismiss them. Nothing
-- is merged or deleted: a confirmed repeat stays in its list, labelled, and
-- leaves only the "people" counts. A dismissed pair is never suggested again,
-- because the scan only ever inserts pairs it has not seen.
-- record_id is always the later entry and original_id the earlier one.

CREATE TABLE IF NOT EXISTS "duplicate_matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "list" text NOT NULL,
  "record_id" uuid NOT NULL,
  "original_id" uuid NOT NULL,
  "reasons" jsonb NOT NULL,
  "status" text DEFAULT 'suggested' NOT NULL,
  "automatic" boolean DEFAULT false NOT NULL,
  "decided_by" uuid REFERENCES "users"("id") ON DELETE set null,
  "decided_at" timestamp with time zone,
  CONSTRAINT "duplicate_matches_list" CHECK ("list" IN ('applicants', 'partners', 'messages')),
  CONSTRAINT "duplicate_matches_status" CHECK ("status" IN ('suggested', 'confirmed', 'dismissed')),
  CONSTRAINT "duplicate_matches_distinct" CHECK ("record_id" <> "original_id"),
  CONSTRAINT "duplicate_matches_reasons" CHECK (jsonb_typeof("reasons") = 'array' AND jsonb_array_length("reasons") > 0),
  CONSTRAINT "duplicate_matches_decided" CHECK (("status" = 'suggested') = ("decided_at" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "duplicate_matches_pair_key" ON "duplicate_matches" ("list", "record_id", "original_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "duplicate_matches_original_idx" ON "duplicate_matches" ("list", "original_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "duplicate_matches_open_idx" ON "duplicate_matches" ("list", "status");
--> statement-breakpoint
-- When each list was last scanned, so the every-minute worker only rescans a
-- list after something new arrives (or once a day).
CREATE TABLE IF NOT EXISTS "duplicate_scans" (
  "list" text PRIMARY KEY NOT NULL,
  "scanned_at" timestamp with time zone NOT NULL,
  "newest_seen" timestamp with time zone,
  CONSTRAINT "duplicate_scans_list" CHECK ("list" IN ('applicants', 'partners', 'messages'))
);
