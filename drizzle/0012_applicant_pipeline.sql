ALTER TYPE "public"."applicant_status" ADD VALUE IF NOT EXISTS 'under_review';
--> statement-breakpoint
ALTER TYPE "public"."applicant_status" ADD VALUE IF NOT EXISTS 'online_offered';
--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "review_cycle" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "online_offered_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE "identity_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"pathname" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_documents_pathname_key" UNIQUE("pathname")
);
--> statement-breakpoint
ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "identity_documents_applicant_idx" ON "identity_documents" USING btree ("applicant_id");
--> statement-breakpoint
UPDATE "applicants" SET "status" = 'under_review'
WHERE ("track" = 'online' AND "status" = 'round1_complete') OR "status" = 'id_verified';
