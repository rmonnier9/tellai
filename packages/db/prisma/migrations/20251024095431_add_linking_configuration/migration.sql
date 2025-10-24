-- AlterTable
ALTER TABLE "public"."product" ADD COLUMN     "detected_links" JSONB,
ADD COLUMN     "link_source" TEXT NOT NULL DEFAULT 'database';
