CREATE TABLE IF NOT EXISTS "OrganizerVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "collegeEmail" TEXT,
  "organization" TEXT NOT NULL,
  "roleTitle" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "contactLink" TEXT,
  "status" TEXT NOT NULL DEFAULT 'APPROVED',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrganizerVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizerVerification_userId_key" ON "OrganizerVerification"("userId");
CREATE INDEX IF NOT EXISTS "OrganizerVerification_status_idx" ON "OrganizerVerification"("status");
CREATE INDEX IF NOT EXISTS "OrganizerVerification_createdAt_idx" ON "OrganizerVerification"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrganizerVerification_userId_fkey'
  ) THEN
    ALTER TABLE "OrganizerVerification"
      ADD CONSTRAINT "OrganizerVerification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
