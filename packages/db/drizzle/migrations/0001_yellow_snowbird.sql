ALTER TABLE "waitlist" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "waitlist" ALTER COLUMN "created_at" DROP NOT NULL;