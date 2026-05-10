CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add full-text search index for search fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_search_idx
ON "User" USING gin (
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(headline, '') || ' ' ||
    coalesce(bio, '') || ' ' ||
    coalesce(college, '') || ' ' ||
    coalesce(domain, '')
  )
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS user_name_trgm_idx
ON "User" USING gin (name gin_trgm_ops);

-- Add index for Post authorId and visibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS post_author_visibility_idx
ON "Post" ("authorId", visibility);

-- Add index for Orbit fromUserId
CREATE INDEX CONCURRENTLY IF NOT EXISTS orbit_from_user_idx
ON "Orbit" ("fromUserId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS message_sender_idx
ON "Message" ("senderId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS message_receiver_idx
ON "Message" ("receiverId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS message_pair_created_idx
ON "Message" ("senderId", "receiverId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS message_receiver_read_idx
ON "Message" ("receiverId", read);

CREATE INDEX CONCURRENTLY IF NOT EXISTS mentor_relation_mentor_status_idx
ON "MentorRelation" ("mentorId", status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS mentor_relation_mentee_status_idx
ON "MentorRelation" ("menteeId", status);
