-- AlterTable
ALTER TABLE "public"."article" ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "competition" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."product" ADD COLUMN     "competitors" TEXT[] DEFAULT ARRAY[]::TEXT[];
