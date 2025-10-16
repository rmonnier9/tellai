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

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_customer_id" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "active_organization_id" TEXT,
    "active_product_id" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "inviter_id" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "status" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN DEFAULT false,
    "seats" INTEGER,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "language" TEXT,
    "country" TEXT,
    "target_audiences" TEXT[],
    "sitemap_url" TEXT,
    "blog_url" TEXT,
    "best_articles" TEXT[],
    "auto_publish" BOOLEAN NOT NULL DEFAULT true,
    "article_style" TEXT NOT NULL DEFAULT 'informative',
    "internal_links" INTEGER NOT NULL DEFAULT 3,
    "global_instructions" TEXT,
    "image_style" TEXT NOT NULL DEFAULT 'brand-text',
    "brand_color" TEXT NOT NULL DEFAULT '#000000',
    "include_youtube_video" BOOLEAN NOT NULL DEFAULT true,
    "include_call_to_action" BOOLEAN NOT NULL DEFAULT true,
    "include_infographics" BOOLEAN NOT NULL DEFAULT true,
    "include_emojis" BOOLEAN NOT NULL DEFAULT true,
    "subscription_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."article" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "title" TEXT,
    "type" "public"."ArticleType" NOT NULL,
    "guide_subtype" "public"."GuideSubtype",
    "listicle_subtype" "public"."ListicleSubtype",
    "search_volume" INTEGER,
    "keyword_difficulty" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "competition" DOUBLE PRECISION,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."ArticleStatus" NOT NULL DEFAULT 'pending',
    "content" TEXT,
    "published_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "public"."organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_subscription_id_key" ON "public"."product"("subscription_id");

-- CreateIndex
CREATE INDEX "article_product_id_scheduled_date_idx" ON "public"."article"("product_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "article_status_idx" ON "public"."article"("status");

-- CreateIndex
CREATE UNIQUE INDEX "credential_type_external_id_key" ON "public"."credential"("type", "external_id");

-- CreateIndex
CREATE INDEX "job_type_idx" ON "public"."job"("type");

-- CreateIndex
CREATE UNIQUE INDEX "job_type_external_id_key" ON "public"."job"("type", "external_id");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."article" ADD CONSTRAINT "article_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
