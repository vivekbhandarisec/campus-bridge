DROP INDEX IF EXISTS "user_embedding_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "embedding";
