-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "email_notifications_content_planner" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_notifications_article_generated" BOOLEAN NOT NULL DEFAULT true;

