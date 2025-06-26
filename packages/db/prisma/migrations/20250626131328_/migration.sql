-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN "embedding" public.vector(1024);

-- CreateIndex
CREATE INDEX "embedding_idx" ON "waitlist" USING hnsw ("embedding" vector_cosine_ops);
