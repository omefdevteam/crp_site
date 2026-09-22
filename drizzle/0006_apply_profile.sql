ALTER TABLE "applicants" ADD COLUMN "skills" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "can_travel" boolean;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "has_valid_passport" boolean;
