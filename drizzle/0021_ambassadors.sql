-- Ambassador accounts and the stories they post to the home page globe.
-- Apply by hand. Do not run drizzle-kit migrate or drizzle-kit push.
-- The journal and __drizzle_migrations are out of sync, so this file is the
-- source the maintainer runs. Every statement is additive and uses IF NOT EXISTS.
--
-- Ambassadors are not staff. They have their own table, sign-in links and
-- sessions, so an Ambassador link or cookie can never open the admin console,
-- and an applicant who is also staff keeps two separate accounts.
-- An account exists for each accepted applicant. Whether it can sign in is read
-- live from the applicant's status, so a later rejection closes it at once.

CREATE TABLE IF NOT EXISTS "ambassadors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "applicant_id" uuid NOT NULL REFERENCES "applicants"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "display_name" text NOT NULL,
  "bio" text,
  "home_country" text,
  "home_city" text,
  "home_lat" double precision,
  "home_lng" double precision,
  "show_on_globe" boolean DEFAULT false NOT NULL,
  "language" text DEFAULT 'en' NOT NULL,
  "invited_at" timestamp with time zone,
  "last_sign_in_at" timestamp with time zone,
  "disabled_at" timestamp with time zone,
  CONSTRAINT "ambassadors_email_lowercase" CHECK ("email" = lower("email")),
  CONSTRAINT "ambassadors_display_name_len" CHECK (char_length("display_name") BETWEEN 1 AND 60),
  CONSTRAINT "ambassadors_bio_len" CHECK ("bio" IS NULL OR char_length("bio") <= 280),
  CONSTRAINT "ambassadors_home_country" CHECK ("home_country" IS NULL OR "home_country" ~ '^[A-Z]{2}$'),
  CONSTRAINT "ambassadors_home_city_len" CHECK ("home_city" IS NULL OR char_length("home_city") BETWEEN 1 AND 100),
  CONSTRAINT "ambassadors_home_point" CHECK (
    ("home_lat" IS NULL AND "home_lng" IS NULL)
    OR ("home_lat" BETWEEN -90 AND 90 AND "home_lng" BETWEEN -180 AND 180)
  ),
  CONSTRAINT "ambassadors_globe_needs_home" CHECK (NOT "show_on_globe" OR "home_lat" IS NOT NULL),
  CONSTRAINT "ambassadors_language" CHECK ("language" IN ('en', 'fr', 'es', 'pt'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ambassadors_applicant_key" ON "ambassadors" ("applicant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ambassadors_email_key" ON "ambassadors" ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_sign_in_tokens" (
  "hash" text PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ambassador_id" uuid NOT NULL REFERENCES "ambassadors"("id") ON DELETE cascade,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ambassador_sign_in_tokens_expires_idx" ON "ambassador_sign_in_tokens" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ambassador_sessions" (
  "hash" text PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ambassador_id" uuid NOT NULL REFERENCES "ambassadors"("id") ON DELETE cascade,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ambassador_sessions_ambassador_idx" ON "ambassador_sessions" ("ambassador_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ambassador_sessions_expires_idx" ON "ambassador_sessions" ("expires_at");
--> statement-breakpoint
-- A story moves draft -> submitted -> approved or rejected. The Ambassador can
-- withdraw it, and a rejected or withdrawn story can be edited back to draft.
-- Only approved stories are public. A submitted or approved story must carry
-- everything the globe card shows.
CREATE TABLE IF NOT EXISTS "stories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ambassador_id" uuid NOT NULL REFERENCES "ambassadors"("id") ON DELETE cascade,
  "kind" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "title" text,
  "body" text,
  "language" text DEFAULT 'en' NOT NULL,
  "country" text,
  "city" text,
  "lat" double precision,
  "lng" double precision,
  "photo_pathname" text,
  "photo_content_type" text,
  "photo_byte_size" integer,
  "submitted_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE set null,
  "review_reason" text,
  "published_at" timestamp with time zone,
  "version" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "stories_kind" CHECK ("kind" IN ('beacon', 'mission')),
  CONSTRAINT "stories_status" CHECK ("status" IN ('draft', 'submitted', 'approved', 'rejected', 'withdrawn')),
  CONSTRAINT "stories_title_len" CHECK ("title" IS NULL OR char_length("title") BETWEEN 1 AND 120),
  CONSTRAINT "stories_body_len" CHECK ("body" IS NULL OR char_length("body") BETWEEN 1 AND 1000),
  CONSTRAINT "stories_language" CHECK ("language" IN ('en', 'fr', 'es', 'pt')),
  CONSTRAINT "stories_country" CHECK ("country" IS NULL OR "country" ~ '^[A-Z]{2}$'),
  CONSTRAINT "stories_city_len" CHECK ("city" IS NULL OR char_length("city") BETWEEN 1 AND 100),
  CONSTRAINT "stories_point" CHECK (
    ("lat" IS NULL AND "lng" IS NULL)
    OR ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180)
  ),
  CONSTRAINT "stories_photo" CHECK (
    ("photo_pathname" IS NULL AND "photo_content_type" IS NULL AND "photo_byte_size" IS NULL)
    OR (
      "photo_pathname" IS NOT NULL
      AND "photo_content_type" IN ('image/jpeg', 'image/png', 'image/webp')
      AND "photo_byte_size" BETWEEN 1 AND 5242880
    )
  ),
  CONSTRAINT "stories_review_reason_len" CHECK ("review_reason" IS NULL OR char_length("review_reason") <= 500),
  CONSTRAINT "stories_complete_when_sent" CHECK (
    "status" IN ('draft', 'withdrawn')
    OR (
      "title" IS NOT NULL AND "body" IS NOT NULL AND "country" IS NOT NULL
      AND "city" IS NOT NULL AND "lat" IS NOT NULL AND "submitted_at" IS NOT NULL
    )
  ),
  CONSTRAINT "stories_published_when_approved" CHECK (("status" = 'approved') = ("published_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_ambassador_idx" ON "stories" ("ambassador_id", "updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_queue_idx" ON "stories" ("submitted_at") WHERE "status" = 'submitted';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_public_idx" ON "stories" ("kind", "published_at") WHERE "status" = 'approved';
--> statement-breakpoint
-- Append-only history of every story status change, by the Ambassador or staff.
CREATE TABLE IF NOT EXISTS "story_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "story_id" uuid NOT NULL REFERENCES "stories"("id") ON DELETE cascade,
  "actor" text NOT NULL,
  "actor_staff_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  CONSTRAINT "story_events_actor" CHECK ("actor" IN ('ambassador', 'staff')),
  -- A staff row keeps its event when the staff account is deleted (set null).
  CONSTRAINT "story_events_staff" CHECK ("actor" = 'staff' OR "actor_staff_id" IS NULL),
  CONSTRAINT "story_events_reason_len" CHECK ("reason" IS NULL OR char_length("reason") <= 500)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_events_story_idx" ON "story_events" ("story_id", "created_at");
