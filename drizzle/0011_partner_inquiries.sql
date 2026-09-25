CREATE TABLE "partner_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"organization" text NOT NULL,
	"designation" text NOT NULL,
	"support" text NOT NULL,
	"sponsorship" text,
	"message" text
);
