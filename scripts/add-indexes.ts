import { Client } from 'pg';

async function addIndexes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Add vector index for User.embedding
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_embedding_idx
      ON "User" USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    // Add full-text search index for search fields
    await client.query(`
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
    `);

    // Add index for Post authorId and visibility
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS post_author_visibility_idx
      ON "Post" (authorId, visibility);
    `);

    // Add index for Orbit fromUserId
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS orbit_from_user_idx
      ON "Orbit" (fromUserId);
    `);

    console.log('Indexes added successfully');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await client.end();
  }
}

addIndexes();