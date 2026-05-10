# CampusBridge

CampusBridge is a college networking app for students and alumni. It combines profile onboarding, campus events, mentor matching, feed posts, realtime-style messaging, search, reports, and CampusCred rewards.

## Core Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Clerk for authentication
- Prisma ORM
- PostgreSQL, commonly via Supabase
- Supabase Storage and Realtime client features

## Current Features

- Student and alumni onboarding with profile completion checks
- Capability-based access for organizers, mentors, recruiters, moderators, and admins
- Organizer verification flow that grants the `ORGANIZER` capability
- Feed posts with text, image, poll, and link post types
- Likes, bookmarks, comments, shares, reports, and post deletion
- Event listings, event creation for organizers/admins, and event registration
- Mentor recommendations using domain, skills, goals, activity, availability, and CampusCred signals
- Mentorship request and response endpoints
- Profile search and public profile pages
- Messaging backed by the `Message` table with Supabase Realtime subscriptions
- Leaderboard and CampusCred badge/event tracking

## Project Organization

- `app/` - App Router pages, layouts, loading states, and API route handlers
- `components/` - shared UI primitives and feature components
- `contexts/` - React context providers
- `hooks/` - custom React hooks
- `lib/` - Prisma, Supabase, matching, capabilities, profile, and utility helpers
- `prisma/` - Prisma schema, seed data, and migrations
- `scripts/` - database checks, repair scripts, and migration helpers

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in the required environment variables:

- `DATABASE_URL` - PostgreSQL connection string used by Prisma
- `DIRECT_URL` - direct PostgreSQL connection string used by Prisma migrations and repair scripts
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for client-side Supabase features

Optional:

- `DEBUG_PRISMA_QUERIES=true` - enables Prisma query logging in `lib/prisma.ts`

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Seed development data, if needed:

```bash
npm run prisma:seed
```

6. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start the local Next.js dev server
- `npm run build` - run `prisma generate` and build the Next.js app
- `npm run start` - start the production server after a build
- `npm run demo` - build and start the production server
- `npm run lint` - run Next.js ESLint checks
- `npm run prisma:generate` - regenerate Prisma Client
- `npm run prisma:seed` - seed development data with `prisma/seed.ts`

## Database Notes

The Prisma schema currently models users as `STUDENT` or `ALUMNI`. Higher-trust responsibilities are represented as user capabilities, not roles. For example, event organizers are alumni or students with the `ORGANIZER` capability.

When using a Supabase pooled URL, make sure the connection string remains valid after adding pool parameters. `lib/prisma.ts` appends pool options to `DATABASE_URL` when `connection_limit` is missing.

## Verification

Useful checks before committing:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`npm run build` regenerates Prisma Client before building, so it can fail on Windows if another Node or Next.js process is holding Prisma's generated query engine DLL open. Stop the running Node processes or dev server and retry.

## Deployment Notes

- Configure Clerk with the deployed app's redirect URLs.
- Provide all required environment variables in production.
- Use a PostgreSQL-compatible database for Prisma.
- Configure the Supabase `post-images` storage bucket if image posts are enabled.
- Enable Supabase Realtime for the `Message` table if live message updates are expected.
