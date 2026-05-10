CREATE TYPE "Capability" AS ENUM ('ORGANIZER', 'MENTOR', 'RECRUITER', 'MODERATOR', 'ADMIN');
CREATE TYPE "BadgeKind" AS ENUM ('ACHIEVEMENT', 'PARTICIPATION', 'ORGANIZER', 'PROGRAM');

CREATE TABLE "UserCapability" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "capability" "Capability" NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT,

  CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AchievementBadge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "kind" "BadgeKind" NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AchievementBadge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Event" ADD COLUMN "organizerId" TEXT;
CREATE UNIQUE INDEX "UserCapability_userId_capability_key" ON "UserCapability"("userId", "capability");
CREATE INDEX "UserCapability_capability_idx" ON "UserCapability"("capability");
CREATE INDEX "AchievementBadge_userId_key_idx" ON "AchievementBadge"("userId", "key");
CREATE INDEX "AchievementBadge_eventId_idx" ON "AchievementBadge"("eventId");
CREATE INDEX "AchievementBadge_kind_idx" ON "AchievementBadge"("kind");

ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AchievementBadge" ADD CONSTRAINT "AchievementBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AchievementBadge" ADD CONSTRAINT "AchievementBadge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "UserCapability" ("id", "userId", "capability", "assignedAt")
SELECT md5(random()::text || clock_timestamp()::text), "id", 'ORGANIZER'::"Capability", CURRENT_TIMESTAMP
FROM "User"
WHERE "role"::text = 'COLLEGE_ADMIN'
ON CONFLICT ("userId", "capability") DO NOTHING;

UPDATE "User"
SET "role" = 'ALUMNI'::"Role"
WHERE "role"::text = 'COLLEGE_ADMIN';
