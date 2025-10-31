-- CreateEnum
CREATE TYPE "public"."ContentLength" AS ENUM ('short', 'medium', 'long', 'comprehensive');

-- AlterTable
ALTER TABLE "public"."article" ADD COLUMN     "content_length" "public"."ContentLength";
