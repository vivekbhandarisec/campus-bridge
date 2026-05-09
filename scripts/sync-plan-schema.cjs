require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const statements = [
  `DO $$ BEGIN
    CREATE TYPE "PostType" AS ENUM ('TEXT', 'IMAGE', 'POLL', 'LINK');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'TEXT';`,
  `ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'IMAGE';`,
  `ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'POLL';`,
  `ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'LINK';`,
  `DO $$ BEGIN
    CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'CONNECTIONS', 'COLLEGE_ONLY');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE "MentorStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'ENDED');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "headline" TEXT;`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "industry" TEXT;`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "graduationYear" INTEGER;`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL DEFAULT '';`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Post' AND column_name = 'content'
    ) THEN
      UPDATE "Post" SET "body" = COALESCE(NULLIF("body", ''), "content");
      ALTER TABLE "Post" ALTER COLUMN "content" SET DEFAULT '';
    END IF;
  END $$;`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "type" "PostType" NOT NULL DEFAULT 'TEXT';`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
  `UPDATE "Post"
    SET "type" = CASE
      WHEN "type"::text = 'OPPORTUNITY' THEN 'LINK'::"PostType"
      ELSE 'TEXT'::"PostType"
    END
    WHERE "type"::text IN ('GENERAL', 'ADVICE', 'OPPORTUNITY');`,
  `CREATE OR REPLACE FUNCTION sync_post_content_body()
    RETURNS trigger AS $$
    BEGIN
      IF NEW."body" IS NULL OR NEW."body" = '' THEN
        NEW."body" := COALESCE(NEW."content", '');
      END IF;
      IF NEW."content" IS NULL OR NEW."content" = '' THEN
        NEW."content" := COALESCE(NEW."body", '');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
  `DROP TRIGGER IF EXISTS "sync_post_content_body_trigger" ON "Post";`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Post' AND column_name = 'content'
    ) THEN
      CREATE TRIGGER "sync_post_content_body_trigger"
      BEFORE INSERT OR UPDATE ON "Post"
      FOR EACH ROW EXECUTE FUNCTION sync_post_content_body();
    END IF;
  END $$;`,

  `CREATE TABLE IF NOT EXISTS "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Share" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Poll" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3),
    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "PollVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Orbit" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Orbit_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "MentorRelation" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" "MentorStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorRelation_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_postId_key" ON "Like"("userId", "postId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Share_userId_postId_key" ON "Share"("userId", "postId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_userId_postId_key" ON "Bookmark"("userId", "postId");`,
  `CREATE INDEX IF NOT EXISTS "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt" DESC);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Poll_postId_key" ON "Poll"("postId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PollVote_userId_optionId_key" ON "PollVote"("userId", "optionId");`,
  `CREATE INDEX IF NOT EXISTS "Orbit_toUserId_idx" ON "Orbit"("toUserId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Orbit_fromUserId_toUserId_key" ON "Orbit"("fromUserId", "toUserId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MentorRelation_mentorId_menteeId_key" ON "MentorRelation"("mentorId", "menteeId");`,
  `CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "Post_visibility_createdAt_idx" ON "Post"("visibility", "createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);`,

  `DO $$ BEGIN
    ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Share" ADD CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Share" ADD CONSTRAINT "Share_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Poll" ADD CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Orbit" ADD CONSTRAINT "Orbit_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Orbit" ADD CONSTRAINT "Orbit_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "MentorRelation" ADD CONSTRAINT "MentorRelation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "MentorRelation" ADD CONSTRAINT "MentorRelation_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
];

async function main() {
  await prisma.$executeRawUnsafe('SET statement_timeout = 30000');
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('Like', 'Comment', 'Share', 'Bookmark', 'Poll', 'PollOption', 'PollVote', 'Orbit', 'MentorRelation')
    ORDER BY table_name
  `;
  console.log(`Synced ${tables.length} plan tables: ${tables.map((row) => row.table_name).join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
