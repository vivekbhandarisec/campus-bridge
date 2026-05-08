# CampusBridge

CampusBridge is a college networking platform for students, alumni, and college admins. Students complete a skills profile, discover alumni mentors, follow campus events, post updates, and message people in the network.

## Tech stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Clerk authentication
- Prisma ORM
- PostgreSQL / Supabase
- pgvector for AI profile embeddings
- OpenAI embeddings with a local fallback for development

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the values using your own services.

### DATABASE_URL

This is the PostgreSQL connection string used by Prisma.

Examples:

- Local Postgres:
  `postgresql://postgres:password@localhost:5432/campusbridge`
- Supabase:
  `postgresql://postgres:password@aws-1-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

If you use Supabase, replace `postgres`, `password`, and `<project>` with your actual database user, password, and host.

### Clerk

Set these values from your Clerk dashboard:

- `NEXT_PUBLIC_CLERK_FRONTEND_API`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### OpenAI

- `OPENAI_API_KEY=your-openai-api-key`

### Supabase realtime

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
