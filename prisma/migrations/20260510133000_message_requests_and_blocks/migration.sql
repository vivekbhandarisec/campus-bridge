CREATE TYPE "MessageRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "MessageRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "initialMessage" TEXT NOT NULL,
  "status" "MessageRequestStatus" NOT NULL DEFAULT 'PENDING',
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MessageRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageRequest_requesterId_receiverId_key" ON "MessageRequest"("requesterId", "receiverId");
CREATE INDEX "MessageRequest_receiverId_status_createdAt_idx" ON "MessageRequest"("receiverId", "status", "createdAt");
CREATE INDEX "MessageRequest_requesterId_status_createdAt_idx" ON "MessageRequest"("requesterId", "status", "createdAt");
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

ALTER TABLE "MessageRequest" ADD CONSTRAINT "MessageRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageRequest" ADD CONSTRAINT "MessageRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "MessageRequest" (
  "id", "requesterId", "receiverId", "initialMessage", "status", "respondedAt", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  "senderId",
  "receiverId",
  "content",
  'ACCEPTED'::"MessageRequestStatus",
  "createdAt",
  "createdAt",
  "createdAt"
FROM (
  SELECT DISTINCT ON (LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId"))
    "senderId", "receiverId", "content", "createdAt"
  FROM "Message"
  ORDER BY LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId"), "createdAt" ASC
) first_messages
ON CONFLICT ("requesterId", "receiverId") DO NOTHING;
