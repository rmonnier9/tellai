-- CreateTable
CREATE TABLE "public"."blog_topic_finder_analysis" (
    "id" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "analyzed_urls" TEXT[],
    "ideas" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_topic_finder_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_topic_finder_analysis_base_url_idx" ON "public"."blog_topic_finder_analysis"("base_url");

-- CreateIndex
CREATE INDEX "blog_topic_finder_analysis_created_at_idx" ON "public"."blog_topic_finder_analysis"("created_at");
