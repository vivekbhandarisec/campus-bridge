import 'dotenv/config';
import { Client } from 'pg';

async function runIndex(client: Client, label: string, sql: string) {
  try {
    await client.query(sql);
    console.log(`Created or verified ${label}`);
  } catch (error) {
    console.warn(`Skipped ${label}:`, error instanceof Error ? error.message : error);
  }
}

async function addIndexes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    await runIndex(client, 'pg_trgm extension', `
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    // Add vector index for User.embedding
    await runIndex(client, 'user_embedding_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_embedding_idx
      ON "User" USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    // Add full-text search index for search fields
    await runIndex(client, 'user_search_idx', `
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

    await runIndex(client, 'user_name_trgm_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_name_trgm_idx
      ON "User" USING gin (name gin_trgm_ops);
    `);

    // Add index for Post authorId and visibility
    await runIndex(client, 'post_author_visibility_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS post_author_visibility_idx
      ON "Post" ("authorId", visibility);
    `);

    // Add index for Orbit fromUserId
    await runIndex(client, 'orbit_from_user_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS orbit_from_user_idx
      ON "Orbit" ("fromUserId");
    `);

    await runIndex(client, 'message_sender_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS message_sender_idx
      ON "Message" ("senderId");
    `);

    await runIndex(client, 'message_receiver_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS message_receiver_idx
      ON "Message" ("receiverId");
    `);

    await runIndex(client, 'message_pair_created_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS message_pair_created_idx
      ON "Message" ("senderId", "receiverId", "createdAt");
    `);

    await runIndex(client, 'message_receiver_read_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS message_receiver_read_idx
      ON "Message" ("receiverId", read);
    `);

    await runIndex(client, 'mentor_relation_mentor_status_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS mentor_relation_mentor_status_idx
      ON "MentorRelation" ("mentorId", status);
    `);

    await runIndex(client, 'mentor_relation_mentee_status_idx', `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS mentor_relation_mentee_status_idx
      ON "MentorRelation" ("menteeId", status);
    `);

    console.log('Indexes added successfully');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await client.end();
  }
}

addIndexes();
