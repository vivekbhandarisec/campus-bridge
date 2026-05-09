-- Add vector index for User.embedding
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_embedding_idx
ON "User" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

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

-- Add index for Post authorId and visibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS post_author_visibility_idx
ON "Post" (authorId, visibility);

-- Add index for Orbit fromUserId
CREATE INDEX CONCURRENTLY IF NOT EXISTS orbit_from_user_idx
ON "Orbit" (fromUserId);