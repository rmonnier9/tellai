-- CreateEnum
CREATE TYPE "public"."ArticleType" AS ENUM ('guide', 'listicle');

-- CreateEnum
CREATE TYPE "public"."GuideSubtype" AS ENUM ('how_to', 'explainer', 'comparison', 'reference');

-- CreateEnum
CREATE TYPE "public"."ListicleSubtype" AS ENUM ('round_up', 'resources', 'examples');

-- CreateEnum
CREATE TYPE "public"."ArticleStatus" AS ENUM ('pending', 'generated', 'published');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('content_planner', 'article_generation');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('pending', 'error', 'running', 'done');

-- CreateEnum
CREATE TYPE "public"."CredentialType" AS ENUM ('shopify', 'wordpress', 'webhook', 'notion', 'webflow', 'wix', 'framer');

-- AlterTable
ALTER TABLE "public"."product" ADD COLUMN     "articleStyle" TEXT NOT NULL DEFAULT 'informative',
ADD COLUMN     "autoPublish" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bestArticles" TEXT[],
ADD COLUMN     "blogUrl" TEXT,
ADD COLUMN     "brandColor" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "country" TEXT,
ADD COLUMN     "globalInstructions" TEXT,
ADD COLUMN     "imageStyle" TEXT NOT NULL DEFAULT 'brand-text',
ADD COLUMN     "includeCallToAction" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "includeEmojis" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "includeInfographics" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "includeYoutubeVideo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "internalLinks" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "sitemapUrl" TEXT,
ADD COLUMN     "targetAudiences" TEXT[];

-- CreateTable
CREATE TABLE "public"."article" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "title" TEXT,
    "type" "public"."ArticleType" NOT NULL,
    "guideSubtype" "public"."GuideSubtype",
    "listicleSubtype" "public"."ListicleSubtype",
    "searchVolume" INTEGER,
    "keywordDifficulty" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "competition" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."ArticleStatus" NOT NULL DEFAULT 'pending',
    "content" TEXT,
    "publishedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credential" (
    "id" TEXT NOT NULL,
    "type" "public"."CredentialType" NOT NULL,
    "name" TEXT,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "external_id" TEXT,
    "config" JSONB,
    "product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."publication" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "article_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job" (
    "id" TEXT NOT NULL,
    "type" "public"."JobType" NOT NULL DEFAULT 'content_planner',
    "status" "public"."JobStatus" NOT NULL DEFAULT 'pending',
    "external_id" TEXT,
    "error" TEXT,
    "user_id" TEXT,
    "product_id" TEXT,
    "article_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_productId_scheduledDate_idx" ON "public"."article"("productId", "scheduledDate");

-- CreateIndex
CREATE INDEX "article_status_idx" ON "public"."article"("status");

-- CreateIndex
CREATE UNIQUE INDEX "credential_type_external_id_key" ON "public"."credential"("type", "external_id");

-- CreateIndex
CREATE INDEX "job_type_idx" ON "public"."job"("type");

-- CreateIndex
CREATE UNIQUE INDEX "job_type_external_id_key" ON "public"."job"("type", "external_id");

-- AddForeignKey
ALTER TABLE "public"."article" ADD CONSTRAINT "article_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credential" ADD CONSTRAINT "credential_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publication" ADD CONSTRAINT "publication_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publication" ADD CONSTRAINT "publication_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job" ADD CONSTRAINT "job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job" ADD CONSTRAINT "job_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job" ADD CONSTRAINT "job_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
