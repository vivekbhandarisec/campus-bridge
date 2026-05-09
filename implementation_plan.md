# Implementation Plan for CampusBridge QA & Bug Fix Audit
# CampusBridge — Full Implementation & Enhancement Guide

> Next-gen alumni-student platform built on Next.js 14, Prisma, Clerk, Supabase, and OpenAI.
> This document covers every enhancement needed: UI fixes, new features, and innovative system designs.

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [UI Layout & Spacing Fixes](#2-ui-layout--spacing-fixes)
3. [Onboarding Flow Redesign — Single Entry Point](#3-onboarding-flow-redesign--single-entry-point)
4. [Enhanced Feed & Post Composer](#4-enhanced-feed--post-composer)
5. [Post Engagement System](#5-post-engagement-system)
6. [Alumni & Student Search](#6-alumni--student-search)
7. [The Orbit Follow System — Innovative Connection Model](#7-the-orbit-follow-system--innovative-connection-model)
8. [Role-Based Dashboards](#8-role-based-dashboards)
9. [Feed Optimization & Performance](#9-feed-optimization--performance)
10. [CampusCred Enhancements](#10-campuscred-enhancements)
11. [Database Schema Changes](#11-database-schema-changes)
12. [API Routes to Add or Modify](#12-api-routes-to-add-or-modify)
13. [Implementation Phases](#13-implementation-phases)

---

## 1. Tech Stack Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, lucide-react |
| Auth | Clerk |
| Database | PostgreSQL via Prisma ORM |
| Realtime | Supabase (messages + live feed updates) |
| AI Matching | OpenAI embeddings + pgvector |
| Backend | Next.js API routes (`app/api/`) |

No new dependencies are required for most features below. A few optional additions are called out where relevant.

---

## 2. UI Layout & Spacing Fixes

### Problem

The current layout has inconsistent horizontal gaps — feed cards bleed to the viewport edges on mobile, sidebars crowd main content, and container widths are inconsistently applied across pages.

### Root cause

There is no consistent layout wrapper enforcing max-width + horizontal padding across all pages. Each page handles spacing independently.

### Fix: Global Layout Shell

Create a reusable layout component at `components/layout/PageShell.tsx`:

```tsx
// components/layout/PageShell.tsx
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
```

Wrap every page's root element with `<PageShell>`. This enforces `max-w-6xl` (1152px) with responsive side padding on all breakpoints.

### Feed + Sidebar Grid

Replace ad-hoc flex layouts with a CSS grid:

```tsx
// app/(main)/feed/page.tsx
<PageShell>
  <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[1fr_320px]">
    <main className="min-w-0">{/* Feed */}</main>
    <aside className="hidden lg:block">{/* Sidebar */}</aside>
  </div>
</PageShell>
```

The `min-w-0` on the main column prevents overflow from long words or images.

### Mobile Cards

All card components (`PostCard`, `ProfileCard`, `EventCard`) should have:

```tsx
className="rounded-xl border border-border bg-card p-4 shadow-sm"
```

Remove any hardcoded `mx-4` or `px-2` inside cards — padding belongs on the container, not the card.

### Typography Scale

Add to `tailwind.config.ts`:

```ts
fontSize: {
  'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
  'heading': ['1.5rem',  { lineHeight: '2rem',   fontWeight: '600' }],
  'subhead': ['1.125rem',{ lineHeight: '1.75rem', fontWeight: '500' }],
  'body':    ['0.9375rem',{ lineHeight: '1.6rem', fontWeight: '400' }],
  'caption': ['0.8125rem',{ lineHeight: '1.4rem', fontWeight: '400' }],
}
```

---

## 3. Onboarding Flow Redesign — Single Entry Point

### Problem

The landing page has three separate entry points (Alumni / Student / College Admin). When a user clicks any of them, they are taken to a page that again asks "who are you?" — making users declare their role twice. This is confusing and creates unnecessary friction.

### Solution: One Join Button + Role Selection on Onboarding

**Landing page change:** Replace the three separate CTA buttons with a single prominent "Join CampusBridge" button. The three cards can still exist visually to communicate who the platform is for (social proof / marketing), but only one button triggers the auth flow.

```tsx
// app/(landing)/page.tsx  — simplified CTA section
<section className="flex flex-col items-center gap-4 py-20">
  <h1 className="text-display text-center">Where campus meets career</h1>
  <p className="max-w-lg text-center text-muted-foreground">
    Students, alumni, and colleges — one platform to connect, grow, and give back.
  </p>

  {/* Single entry point */}
  <SignUpButton mode="modal">
    <button className="btn-primary text-lg px-8 py-3 rounded-2xl">
      Join CampusBridge
    </button>
  </SignUpButton>

  {/* Visual role cards — marketing only, no separate CTAs */}
  <div className="mt-12 grid grid-cols-3 gap-4 opacity-80">
    <RolePreviewCard role="student" />
    <RolePreviewCard role="alumni" />
    <RolePreviewCard role="college_admin" />
  </div>
</section>
```

**Onboarding step 1** becomes the role selector (only shown once, immediately after Clerk signup):

```tsx
// app/onboarding/page.tsx  — Step 1: Who are you?
const roles = [
  {
    id: 'STUDENT',
    icon: GraduationCap,
    title: 'Student',
    description: 'Find mentors, discover events, build your network while still in college.',
  },
  {
    id: 'ALUMNI',
    icon: Briefcase,
    title: 'Alumni',
    description: 'Give back, stay connected, mentor the next batch from your college.',
  },
  {
    id: 'COLLEGE_ADMIN',
    icon: Building2,
    title: 'College Admin',
    description: 'Manage your college's presence, post events, and verify alumni.',
  },
];
```

After role selection, the user flows into role-specific profile fields (step 2+). The role is saved to the database at `POST /api/users/setup`.

**This removes the duplicate question entirely** — Clerk handles auth, onboarding handles role, and the landing page only sells the product.

---

## 4. Enhanced Feed & Post Composer

### Post Composer Redesign

The current composer is a plain textarea. Replace it with a rich composer that supports multiple content types.

#### Composer UI

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar]  What's on your mind, Rahul?                  │
├─────────────────────────────────────────────────────────┤
│  [Textarea — auto-grows, markdown-lite support]         │
│                                                         │
│  [Image preview grid — up to 4 images, draggable]       │
├─────────────────────────────────────────────────────────┤
│  📷 Photo   📊 Poll   🔗 Link   Aa Format  · [Post →]   │
└─────────────────────────────────────────────────────────┘
```

#### Composer Component

```tsx
// components/feed/PostComposer.tsx

type PostType = 'TEXT' | 'IMAGE' | 'POLL' | 'LINK';

interface ComposerState {
  body: string;
  type: PostType;
  images: File[];
  pollOptions: string[];
  linkUrl: string;
  formatting: { bold: boolean; italic: boolean };
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'COLLEGE_ONLY';
}
```

**Image attachment:** Accept up to 4 images. On selection, show a 2×2 preview grid with remove buttons. Upload to Supabase Storage on post submission, store URLs in the Post record.

**Poll type:** When Poll is selected, show 2–4 option inputs. Store in a separate `Poll` table linked to `Post`. Each poll option tracks vote count via a `PollVote` join table.

**Text formatting toolbar:** Minimal — bold (`**`), italic (`_`), and inline code (`` ` ``) only. These are stored as markdown and rendered client-side with a lightweight parser. Do not add a full rich text editor — it adds too much weight.

**Visibility selector:** A small dropdown — Public, Connections Only, College Only. This is a new `visibility` field on the `Post` model.

#### Post Model Changes (Prisma)

```prisma
model Post {
  id         String   @id @default(cuid())
  authorId   String
  body       String
  type       PostType @default(TEXT)
  imageUrls  String[] // Supabase Storage URLs
  linkUrl    String?
  visibility Visibility @default(PUBLIC)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  author     User     @relation(fields: [authorId], references: [id])
  likes      Like[]
  comments   Comment[]
  shares     Share[]
  poll       Poll?

  @@index([authorId])
  @@index([createdAt])
}

enum PostType {
  TEXT
  IMAGE
  POLL
  LINK
}

enum Visibility {
  PUBLIC
  CONNECTIONS
  COLLEGE_ONLY
}

model Poll {
  id      String       @id @default(cuid())
  postId  String       @unique
  post    Post         @relation(fields: [postId], references: [id])
  options PollOption[]
  endsAt  DateTime?
}

model PollOption {
  id     String     @id @default(cuid())
  pollId String
  text   String
  votes  PollVote[]
  poll   Poll       @relation(fields: [pollId], references: [id])
}

model PollVote {
  id       String     @id @default(cuid())
  userId   String
  optionId String
  option   PollOption @relation(fields: [optionId], references: [id])
  user     User       @relation(fields: [userId], references: [id])

  @@unique([userId, optionId])
}
```

---

## 5. Post Engagement System

### Like, Comment, Share

Add three interaction models to the database and three UI components to each feed card.

#### Database Models

```prisma
model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  post      Post     @relation(fields: [postId], references: [id])

  @@unique([userId, postId])
}

model Comment {
  id        String    @id @default(cuid())
  authorId  String
  postId    String
  body      String
  parentId  String?   // For threaded replies (1 level deep)
  createdAt DateTime  @default(now())
  author    User      @relation(fields: [authorId], references: [id])
  post      Post      @relation(fields: [postId], references: [id])
  parent    Comment?  @relation("Replies", fields: [parentId], references: [id])
  replies   Comment[] @relation("Replies")
}

model Share {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  note      String?  // Optional reshare caption
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  post      Post     @relation(fields: [postId], references: [id])

  @@unique([userId, postId])
}
```

#### Post Card Engagement Bar

```tsx
// components/feed/PostEngagementBar.tsx
<div className="flex items-center gap-1 border-t border-border pt-3 mt-3">
  <LikeButton postId={post.id} likeCount={post._count.likes} isLiked={post.isLiked} />
  <CommentButton postId={post.id} commentCount={post._count.comments} />
  <ShareButton postId={post.id} shareCount={post._count.shares} />
  <div className="ml-auto">
    <BookmarkButton postId={post.id} />
  </div>
</div>
```

**Like button:** Optimistic update — toggle immediately on click, call `POST /api/posts/[id]/like` in background. If API call fails, revert. Use `useOptimistic` (React 18).

**Comment button:** Clicking expands a comment panel inline below the post. Show top 2 comments inline, with a "View all N comments" link. Comments support 1-level threading (reply to a comment).

**Share button:** Opens a small modal with two options — "Repost silently" (immediate, no modal) or "Repost with note" (textarea for caption). Reshared posts appear in the sharer's feed with attribution ("Rahul reposted this").

#### API Routes

```
POST   /api/posts/[id]/like       — toggle like
DELETE /api/posts/[id]/like       — unlike
POST   /api/posts/[id]/comments   — add comment
GET    /api/posts/[id]/comments   — paginated comments
DELETE /api/posts/comments/[cid]  — delete own comment
POST   /api/posts/[id]/share      — repost
```

---

## 6. Alumni & Student Search

### Search Page: `/search`

A dedicated search page that lets any logged-in user find alumni or students by name, college, graduation year, skills, or industry.

#### Search UI Layout

```
┌──────────────────────────────────────────────────────┐
│  🔍  Search alumni, students, skills...              │
├─────────────────┬────────────────────────────────────┤
│  FILTERS        │  RESULTS                           │
│  ─────────      │                                    │
│  Role           │  [ProfileCard]  [ProfileCard]      │
│  ○ All          │  [ProfileCard]  [ProfileCard]      │
│  ○ Alumni       │  [ProfileCard]  [ProfileCard]      │
│  ○ Students     │                                    │
│                 │  [Load more]                       │
│  College        │                                    │
│  [dropdown]     │                                    │
│                 │                                    │
│  Graduation     │                                    │
│  Year           │                                    │
│  [range slider] │                                    │
│                 │                                    │
│  Skills         │                                    │
│  [tag input]    │                                    │
│                 │                                    │
│  Industry       │                                    │
│  [dropdown]     │                                    │
└─────────────────┴────────────────────────────────────┘
```

#### Search API

```ts
// app/api/search/route.ts
// GET /api/search?q=rahul&role=ALUMNI&college=MIT&year=2022&skills=react,node&page=1

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q       = searchParams.get('q') ?? '';
  const role    = searchParams.get('role');
  const college = searchParams.get('college');
  const skills  = searchParams.get('skills')?.split(',') ?? [];
  const page    = parseInt(searchParams.get('page') ?? '1');
  const limit   = 20;

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { headline: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        role ? { role: role as Role } : {},
        college ? { college: { name: { contains: college, mode: 'insensitive' } } } : {},
        skills.length > 0 ? { skills: { hasSome: skills } } : {},
      ]
    },
    select: {
      id: true, name: true, avatarUrl: true,
      role: true, headline: true, skills: true,
      college: { select: { name: true } },
      _count: { select: { followers: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { campusCred: 'desc' },
  });

  return Response.json({ users });
}
```

#### Search Result Card

Each result shows avatar, name, role badge, college, headline, top 3 skills, and an "Orbit" button (see section 7) or "Message" button if already connected.

#### Keyboard-first search

The search input uses a `useDebounce(300ms)` hook to avoid hammering the API on every keystroke. Results update as the user types.

Add a global keyboard shortcut: `Cmd+K` / `Ctrl+K` opens a command-palette style search overlay from anywhere in the app.

---

## 7. The Orbit Follow System — Innovative Connection Model

### Concept: Orbits, Not Followers

Standard follow systems (Instagram, LinkedIn) are passive — you follow, they may or may not notice. CampusBridge has a unique relationship between students and alumni that deserves something better.

**The Orbit System** replaces the standard follow/connect model with a three-tier proximity model:

| Tier | Name | What it means |
|---|---|---|
| 1 | **Orbit** | You've added them to your orbit — like a bookmark with intent. They're notified. |
| 2 | **Aligned** | Both users have orbited each other — mutual interest established. Unlocks DMs. |
| 3 | **Mentor** | An alumni explicitly accepts a mentorship request from a student. Tracked separately. |

This is conceptually fresh because:
- "Orbiting" someone is non-committal — it signals interest without the anxiety of a connection request.
- "Aligned" replaces the awkward LinkedIn "connected" — it means both people chose each other.
- "Mentor" is a deliberate, meaningful relationship with its own dashboard and tracking.

### Orbit Interaction

On any profile page or search result:

```tsx
// Orbit button states
// Not orbiting → shows "Add to Orbit" (planet icon)
// Orbiting, not aligned → shows "In Your Orbit" (filled, pulsing)
// Aligned → shows "Aligned ✦"  (mutual)
// Mentorship active → shows "Mentor" (special badge)
```

When you add someone to your orbit, they receive a notification: **"Priya added you to their orbit"** — not "Priya wants to connect." The framing is warmer and less transactional.

### Orbit Feed

A dedicated `/orbit` page shows posts and updates exclusively from people in your orbit — a curated, high-signal feed vs. the noisy public `/feed`.

### Database Schema

```prisma
model Orbit {
  id         String    @id @default(cuid())
  fromUserId String
  toUserId   String
  createdAt  DateTime  @default(now())

  fromUser   User      @relation("OrbitFrom", fields: [fromUserId], references: [id])
  toUser     User      @relation("OrbitTo",   fields: [toUserId],   references: [id])

  @@unique([fromUserId, toUserId])
  @@index([toUserId])
}

model MentorRelation {
  id         String   @id @default(cuid())
  mentorId   String
  menteeId   String
  status     MentorStatus @default(PENDING)
  note       String?  // Student's intro message
  startedAt  DateTime?
  createdAt  DateTime @default(now())

  mentor     User     @relation("AsMentor", fields: [mentorId], references: [id])
  mentee     User     @relation("AsMentee", fields: [menteeId], references: [id])

  @@unique([mentorId, menteeId])
}

enum MentorStatus {
  PENDING
  ACTIVE
  DECLINED
  ENDED
}
```

### Orbit Count Display

On profile pages, replace "X followers / X following" with:

```
◎ 142 in orbit  ✦ 38 aligned  🎓 12 mentees
```

This is more meaningful at a glance than raw follower counts.

### API Routes

```
POST   /api/orbit/[userId]         — add user to orbit
DELETE /api/orbit/[userId]         — remove from orbit
GET    /api/orbit/aligned          — list aligned users (mutual orbit)
POST   /api/mentorship/request     — student requests mentorship from alumni
PUT    /api/mentorship/[id]/respond — alumni accepts or declines
GET    /api/mentorship/active      — active mentorships for current user
```

---

## 8. Role-Based Dashboards

### Student Dashboard `/dashboard` (role = STUDENT)

Sections:
- **Orbit Feed** — posts from orbited alumni
- **AI Mentor Matches** — top 5 AI-matched alumni (existing feature, surfaced prominently)
- **Upcoming Events** — events from student's college
- **CampusCred Progress** — visual score with next milestone

### Alumni Dashboard `/dashboard` (role = ALUMNI)

Sections:
- **Mentee Requests** — pending mentorship requests with accept/decline
- **Active Mentees** — current mentees, last interaction date
- **Orbit Feed** — posts from orbited users
- **Your Impact** — total students mentored, CampusCred earned from mentorship
- **College Activity** — events and news from their college

### College Admin Dashboard `/admin/college`

Sections:
- **Alumni Verification Queue** — approve/reject alumni who claimed this college
- **Event Manager** — create, edit, publish events
- **College Feed** — posts tagged with this college
- **Analytics** — engagement rates, active users, top mentors

---

## 9. Feed Optimization & Performance

### Cursor-Based Pagination

Replace offset-based pagination (`skip`) with cursor-based (`cursor`) for the feed. This avoids the "shifting results" problem as new posts come in.

```ts
// GET /api/feed?cursor=<postId>&limit=10
const posts = await prisma.post.findMany({
  take: limit + 1,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
  where: { visibility: 'PUBLIC' }, // + orbit filter if on /orbit
});

const hasMore = posts.length > limit;
const nextCursor = hasMore ? posts[limit - 1].id : null;
```

### Realtime New Post Banner

Use Supabase Realtime to listen for new posts. When a new post arrives while the user is on the feed, show a non-intrusive banner:

```
▲ 3 new posts — click to refresh
```

Do not auto-insert posts into the feed — this disrupts scroll position. Let the user choose when to refresh.

```ts
// In the feed component
const channel = supabase
  .channel('public:Post')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Post' }, 
    (payload) => setNewPostCount(c => c + 1))
  .subscribe();
```

### Feed Query Optimization

Add the following Prisma indexes:

```prisma
model Post {
  // Existing fields...
  @@index([createdAt(sort: Desc)])
  @@index([authorId, createdAt(sort: Desc)])
  @@index([visibility, createdAt(sort: Desc)])
}
```

Include like/comment counts and "isLiked by current user" in a single query using Prisma `_count` and a raw subquery to avoid N+1:

```ts
const posts = await prisma.post.findMany({
  include: {
    author: { select: { id: true, name: true, avatarUrl: true, role: true } },
    _count: { select: { likes: true, comments: true, shares: true } },
    likes: {
      where: { userId: currentUserId },
      select: { id: true },
      take: 1,
    },
  },
});
// posts[n].likes.length > 0 means current user liked it
```

---

## 10. CampusCred Enhancements

### Current state
CampusCred is awarded for creating posts and registering for events.

### New earning actions

| Action | Points |
|---|---|
| Create a post | +5 |
| Post gets 10 likes | +10 |
| Register for event | +5 |
| Attend event (checked in) | +15 |
| Accept mentorship request | +20 |
| Complete mentorship milestone | +30 |
| Profile 100% complete | +25 (one-time) |
| Someone orbits you | +2 |
| Become aligned with someone | +5 |
| Refer a new user who joins | +15 |

### CampusCred Levels

Replace the raw number display with a named tier system:

| Tier | Points | Label |
|---|---|---|
| 0 | 0–99 | Newcomer |
| 1 | 100–299 | Explorer |
| 2 | 300–699 | Connector |
| 3 | 700–1499 | Influencer |
| 4 | 1500–2999 | Pioneer |
| 5 | 3000+ | Legend |

Display the tier name and a progress bar to the next tier on the profile and dashboard.

### Leaderboard Enhancement

The `/leaderboard` page currently shows a flat ranking. Add filters: by college, by graduation year, by role (alumni vs students separately). Add a "This Month" toggle alongside the all-time view.

---

## 11. Database Schema Changes

Summary of all Prisma model changes across sections:

```prisma
// ADD to Post model
type       PostType   @default(TEXT)
imageUrls  String[]
linkUrl    String?
visibility Visibility @default(PUBLIC)

// NEW models
Poll, PollOption, PollVote   — post polls
Like, Comment, Share         — post engagement
Orbit                        — orbit follow system
MentorRelation               — mentorship tracking

// ADD to User model
headline   String?           — short bio line under name
industry   String?           — for alumni
gradYear   Int?              — graduation year

// NEW enums
PostType: TEXT | IMAGE | POLL | LINK
Visibility: PUBLIC | CONNECTIONS | COLLEGE_ONLY
MentorStatus: PENDING | ACTIVE | DECLINED | ENDED
```

Run migrations:
```bash
npx prisma migrate dev --name add_engagement_and_orbit_system
```

---

## 12. API Routes to Add or Modify

| Method | Route | Description |
|---|---|---|
| POST | `/api/posts` | Update to handle type, imageUrls, linkUrl, visibility, poll |
| POST | `/api/posts/[id]/like` | Toggle like |
| DELETE | `/api/posts/[id]/like` | Remove like |
| GET | `/api/posts/[id]/comments` | Paginated comments |
| POST | `/api/posts/[id]/comments` | Add comment |
| POST | `/api/posts/[id]/share` | Repost |
| GET | `/api/search` | Search users by role/college/skills/name |
| POST | `/api/orbit/[userId]` | Add to orbit |
| DELETE | `/api/orbit/[userId]` | Remove from orbit |
| GET | `/api/orbit/aligned` | Get mutually aligned users |
| POST | `/api/mentorship/request` | Request mentorship |
| PUT | `/api/mentorship/[id]/respond` | Accept or decline |
| GET | `/api/feed/orbit` | Orbit-only feed |
| POST | `/api/posts/[id]/poll/vote` | Vote on a poll option |

---

## 13. Implementation Phases

### Phase 1 — Foundations (Week 1–2)
- [ ] Create `PageShell` layout component and apply to all pages
- [ ] Fix all side gap / spacing issues across feed, profile, events pages
- [ ] Remove duplicate role-selection from landing page; keep only in onboarding
- [ ] Add `Cmd+K` global search shortcut (UI only, no backend yet)

### Phase 2 — Post Composer & Engagement (Week 2–3)
- [ ] Build rich post composer with image, poll, link, text formatting tabs
- [ ] Supabase Storage integration for image uploads
- [ ] Add Like, Comment, Share to database and UI
- [ ] Optimistic like/unlike with `useOptimistic`
- [ ] Inline comment panel on feed cards
- [ ] Update `POST /api/posts` to handle new post types

### Phase 3 — Search (Week 3)
- [ ] Build `/search` page with filter sidebar
- [ ] `GET /api/search` route with Prisma filters
- [ ] Debounced search input
- [ ] Command-palette overlay (`Cmd+K`)

### Phase 4 — Orbit System (Week 4)
- [ ] `Orbit` and `MentorRelation` database models + migration
- [ ] Orbit button component (3 states)
- [ ] `/orbit` feed page (posts from orbited users)
- [ ] Orbit count display on profiles
- [ ] Mentorship request flow for students → alumni
- [ ] Mentorship response UI for alumni

### Phase 5 — Dashboards & CampusCred (Week 5)
- [ ] Role-differentiated dashboard page at `/dashboard`
- [ ] Student dashboard: orbit feed, AI matches, events, cred progress
- [ ] Alumni dashboard: mentee requests, active mentees, impact stats
- [ ] CampusCred tier system with level names and progress bar
- [ ] Leaderboard filters (by college, by year, by role)

### Phase 6 — Performance & Realtime (Week 6)
- [ ] Switch feed to cursor-based pagination
- [ ] Add Prisma feed indexes
- [ ] Supabase Realtime new-post banner
- [ ] Feed query optimization (eliminate N+1 for like status)

---

## Design Principles

Throughout all of the above, the guiding UX principles are:

**Not LinkedIn.** LinkedIn is dense, transactional, and anxiety-inducing. CampusBridge should feel lighter, warmer, and more campus-appropriate. Less "professional network", more "extended campus community."

**Orbit > Follow.** The language matters. "Orbiting" someone implies you find them interesting and want to stay close — without demanding they reciprocate immediately. This is better for students who feel intimidated reaching out to senior alumni.

**Actions have meaning.** Every CampusCred action corresponds to something genuinely valuable (mentoring, sharing knowledge, attending events) — not vanity metrics. The leaderboard should feel like a hall of fame, not a popularity contest.

**Mobile first.** A large portion of students access this on phones. Every component — the composer, the orbit button, the search filters — must work cleanly on a 375px viewport before being designed for desktop.

**Speed over features.** Cursor pagination, optimistic updates, and debounced search are not optional polish — they are the baseline for a feed-based app to feel professional.