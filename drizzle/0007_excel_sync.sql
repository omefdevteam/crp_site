CREATE TABLE "excel_sync_state" (
  "singleton" boolean PRIMARY KEY DEFAULT true,
  "locked_until" timestamp with time zone,
  "last_error" text,
  "last_run_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "excel_cursors" (
  "table_name" text PRIMARY KEY,
  "cursor" bigint DEFAULT 0 NOT NULL
);
