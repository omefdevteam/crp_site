-- Waitlist page details (Figma 124:227): date of birth, superpower, subject, organization.
-- Apply by hand. Do not run drizzle-kit migrate or drizzle-kit push.
-- Every statement is additive, nullable and uses IF NOT EXISTS, so existing sign-ups are untouched.

ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "dob" date;
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "superpower" text;
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "subject" text;
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "organization" text;
