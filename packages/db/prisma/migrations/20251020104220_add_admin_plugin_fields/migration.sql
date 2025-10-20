-- AlterTable
ALTER TABLE "public"."session" ADD COLUMN     "impersonated_by" TEXT;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "ban_expires" TIMESTAMP(3),
ADD COLUMN     "ban_reason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT DEFAULT 'user';
