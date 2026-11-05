-- Partner and funder logos that staff manage under Website text.
-- Apply by hand. Do not run drizzle-kit migrate or drizzle-kit push.
-- The journal and __drizzle_migrations are out of sync, so this file is the
-- source the maintainer runs. Every statement is additive and uses IF NOT EXISTS.
--
-- A logo group with no rows shows the logos built into the site, so nothing
-- changes on the site until staff edit a group. The first edit copies the
-- built-in logos in (builtin names one of them); after that every logo is a
-- row. Uploaded files sit in the public logo Blob store (url, pathname).

CREATE TABLE IF NOT EXISTS "site_logos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "logo_group" text NOT NULL,
  "position" integer NOT NULL,
  "name" text NOT NULL,
  "link_url" text,
  "builtin" text,
  "url" text,
  "pathname" text,
  "content_type" text,
  "byte_size" integer,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE set null,
  CONSTRAINT "site_logos_group_format" CHECK ("logo_group" ~ '^[a-z]+(\.[a-z]+)+$'),
  CONSTRAINT "site_logos_position" CHECK ("position" >= 0),
  CONSTRAINT "site_logos_name_len" CHECK (char_length("name") BETWEEN 1 AND 120),
  CONSTRAINT "site_logos_link" CHECK ("link_url" IS NULL OR (char_length("link_url") <= 500 AND "link_url" LIKE 'https://%')),
  CONSTRAINT "site_logos_source" CHECK (
    (
      "builtin" IS NOT NULL AND "url" IS NULL AND "pathname" IS NULL AND "content_type" IS NULL AND "byte_size" IS NULL
    ) OR (
      "builtin" IS NULL AND "url" LIKE 'https://%' AND "pathname" IS NOT NULL
      AND "content_type" IN ('image/png', 'image/jpeg', 'image/svg+xml', 'image/webp')
      AND "byte_size" BETWEEN 1 AND 524288
    )
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "site_logos_group_idx" ON "site_logos" ("logo_group", "position");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "site_logos_group_builtin_key" ON "site_logos" ("logo_group", "builtin") WHERE "builtin" IS NOT NULL;
