# CampusBridge

CampusBridge is a college networking app for students and alumni. It supports role-based onboarding, campus events, alumni mentor matching, feed posts, direct messaging, profile discovery, reports, and CampusCred rewards.

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Authentication:** Clerk
- **Backend:** Next.js server components and `app/api/**/route.ts` API handlers
- **Database ORM:** Prisma
- **Database:** PostgreSQL, commonly through Supabase Postgres
- **Realtime:** Supabase Realtime for chat message inserts
- **Storage:** Supabase Storage for post images through the `post-images` bucket
- **Tooling:** ESLint, Prisma migrations, TypeScript compiler

## Workflow

```text
User in browser
-> Next.js React UI
-> Clerk authentication and session checks
-> Next.js server component or API route
-> Prisma Client
-> PostgreSQL database
-> Supabase Storage or Realtime when files/live updates are needed
-> React UI updates
```

### Runtime Flow

1. A user signs in through Clerk.
2. Clerk middleware protects private pages and API routes.
3. Server pages and API handlers call Clerk `auth()` to identify the current user.
4. Next.js server code runs business logic, validation, and authorization checks.
5. Prisma performs type-safe reads and writes against PostgreSQL.
6. Supabase Storage stores uploaded post images.
7. Supabase Realtime streams new chat messages to the messaging UI.

### Development Workflow

1. Install dependencies.

```bash
npm install
```

2. Copy the environment template.

```bash
cp .env.example .env.local
```

3. Fill in the required environment variables.

- `DATABASE_URL` - PostgreSQL connection string used by Prisma
- `DIRECT_URL` - direct PostgreSQL connection string used by Prisma migrations and repair scripts
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for client-side Supabase features

Optional:

- `DEBUG_PRISMA_QUERIES=true` - enables Prisma query logging in `lib/prisma.ts`

4. Generate Prisma Client.

```bash
npm run prisma:generate
```

5. Seed development data if needed.

```bash
npm run prisma:seed
```

6. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Architecture

### Client Layer

- Browser UI is built with React components inside the Next.js App Router.
- Client components handle feed actions, event registration, profile forms, mentor match cards, and messaging interactions.
- Tailwind CSS provides the app styling and responsive layout system.

### Authentication Layer

- Clerk handles sign-up, sign-in, OAuth, sessions, and authenticated identity.
- `middleware.ts` applies Clerk middleware to protected pages and API routes.
- Protected server pages redirect unauthenticated users to sign-in.

### Backend Layer

- Business logic lives in server components and `app/api/**/route.ts` API handlers.
- The app currently uses API route handlers, not Server Actions, for mutations.
- API routes handle validation, authorization, Prisma queries, error responses, and revalidation where needed.

### Data Layer

- Prisma models users, colleges, events, posts, messages, mentorships, reports, polls, bookmarks, likes, comments, capabilities, badges, and CampusCred events.
- PostgreSQL stores relational application data.
- Supabase Storage stores post image uploads.
- Supabase Realtime powers live direct-message updates.

## Current Features

- Student and alumni onboarding with profile completion checks
- Capability-based access for organizers, mentors, recruiters, moderators, and admins
- Organizer verification that grants the `ORGANIZER` capability
- Feed posts with text, image, poll, and link post types
- Likes, bookmarks, comments, shares, reports, and post deletion
- Events, event creation for organizers/admins, and event registration
- Alumni mentor recommendations using domain, skills, goals, activity, availability, and CampusCred signals
- Qualitative match UI with connection insights instead of percentage scores
- Direct messaging backed by the `Message` table and Supabase Realtime
- Profile search and public profile pages
- Leaderboard and CampusCred badge/event tracking

## Project Organization

- `app/` - App Router pages, layouts, loading states, and API route handlers
- `components/` - shared UI primitives and feature components
- `contexts/` - React context providers
- `hooks/` - custom hooks
- `lib/` - Prisma, Supabase, matching, capabilities, profile, and utility helpers
- `prisma/` - Prisma schema, seed data, and migrations
- `scripts/` - database checks, migration helpers, and repair scripts

## Scripts

- `npm run dev` - start the local Next.js dev server
- `npm run build` - run `prisma generate` and build the Next.js app
- `npm run start` - start the production server after a build
- `npm run demo` - build and start the production server
- `npm run lint` - run Next.js ESLint checks
- `npm run prisma:generate` - regenerate Prisma Client
- `npm run prisma:seed` - seed development data with `prisma/seed.ts`

## Database Notes

The Prisma schema models users as `STUDENT` or `ALUMNI`. Higher-trust responsibilities are represented as user capabilities, not roles. For example, event organizers are students or alumni with the `ORGANIZER` capability.

`lib/prisma.ts` adds pool options to `DATABASE_URL` when they are missing. This helps avoid connection pressure during development and server-rendered routes.

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
- Use a PostgreSQL-compatible database for `DATABASE_URL`.
- Configure the Supabase `post-images` storage bucket if image posts are enabled.
- Enable Supabase Realtime for the `Message` table if live message updates are expected.
