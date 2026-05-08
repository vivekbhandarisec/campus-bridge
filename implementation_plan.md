# Implementation Plan for CampusBridge QA & Bug Fix Audit

## Goal
Fix all known bugs (BUG‑01 … BUG‑04), implement role‑based UI, harden middleware and API security, improve performance, and ensure UI consistency across devices.

## User Review Required
> [!IMPORTANT] **Approval Needed** – Before any code changes are made, please approve this plan.

## Open Questions
- Do you want unit/integration tests added for the new middleware and role‑gate logic? (Yes/No)
- Should the admin dashboard be visible to College Admins only, or also to Super‑Admins if they exist in the future? (Confirm)

## Proposed Changes
---
### 1. Middleware & Auth Enhancements (`middleware.ts`)
- Wrap **all** protected routes with `auth().protect()`.
- After authentication, fetch user profile via Prisma to verify `profileComplete` flag.
- Redirect logic:
  - If signed‑in & profileComplete → `/feed`
  - If signed‑in & !profileComplete → `/onboarding`
  - If not signed‑in → allow public routes.
- Add a `useEffect` in root `layout.tsx` to re‑validate session on client navigation (including browser back).

### 2. Prisma Schema Updates (`prisma/schema.prisma`)
- Add `profileComplete Boolean @default(false)` to `User` model.
- Add unique composite index on `(eventId, userId)` for event registrations to prevent duplicates.
- Add `role Enum` if not already present (STUDENT, ALUMNI, COLLEGE_ADMIN).
- Run migration.

### 3. Role‑Based UI
- **Create hook** `useUserRole` in `lib/hooks/useUserRole.ts` that calls `/api/users/me` and provides `{ role, loading }`.
- **Create component** `RoleGate` (`components/RoleGate.tsx`) that renders children only when `role` matches.
- **Update Navbar** (`components/Navbar.tsx`):
  - Show **Admin Dashboard** link only for `COLLEGE_ADMIN`.
  - Show **Match** link only for `STUDENT`.
  - Show **Leaderboard** link only for `STUDENT` & `ALUMNI`.
  - Use Clerk `<SignedIn>` / `<SignedOut>` wrappers for auth UI.
- **Page Guards**:
  - `/match` – server‑side check; if role not STUDENT, redirect to `/feed` with toast.
  - `/admin/college` – protect with `role === COLLEGE_ADMIN` else 403.
  - `/events` – hide "Post Event" for non‑admin.

### 4. Onboarding Flow (`app/onboarding/**`)
- Ensure server‑side redirect to `/feed` if profileComplete.
- Add client‑side `localStorage` backup of form state on each step.
- Validate graduation year: must be ≤ current year for Alumni, > current year for Student.
- After successful `POST /api/users/setup`, set `profileComplete = true`.

### 5. Landing Page (`app/page.tsx`)
- Use `auth()` server‑side to detect signed‑in user.
- Redirect based on `profileComplete` (as in middleware).
- Render guest CTA only for unsigned users.

### 6. API Security Enhancements (`app/api/**`)
- Ensure every route starts with `auth()`.
- For mutations, verify ownership:
  - Posts → `userId === session.clerkId`
  - Events → `role === COLLEGE_ADMIN` && `collegeId matches`
  - Messages → subscription scoped to `session.clerkId`.
- Return `401`/`403` appropriately.
- Strip `embedding` field from all responses.

### 7. Performance Optimizations
- Add pagination to Feed (`GET /api/posts?cursor=&limit=20`).
- Limit Match results to 10.
- Leaderboard query `ORDER BY campusCred DESC, createdAt ASC LIMIT 50`.
- Use `select` in Prisma calls to only fetch needed columns.
- Ensure `<Image>` component with width/height for all images.

### 8. UI/UX Consistency
- Add skeleton loaders (`components/Skeleton.tsx`) for all data‑fetching components.
- Add friendly empty‑state components for Feed, Match, Messages, Events.
- Ensure mobile responsive layouts via Tailwind utility classes.
- Add deterministic ranking tie‑breaker (createdAt) on Leaderboard.

### 9. Supabase Realtime Fix
- In `useMessages` hook, clean up subscription in the cleanup function of `useEffect`.
- Scope channel to `user_${session.clerkId}`.

### 10. Tests (optional, based on Open Question)
- Add Jest tests for middleware redirect logic.
- Add integration test for `RoleGate` component.

## Verification Plan
### Automated Tests
- Run existing test suite (`npm test`).
- Add new tests for middleware and role guards.
### Manual Verification
- Simulate three roles:
  1. **Student** – sign‑in, complete onboarding, verify Feed, Match, Events, no Admin link.
  2. **Alumni** – verify no Match link, mentor toggle, profile view.
  3. **College Admin** – verify Admin Dashboard link, event creation, no Match/Leaderboard.
- Test browser back button retains session.
- Test landing page redirects for signed‑in users.
- Test duplicate event registration blocked.
- Test Supabase message realtime updates and cleanup.
- Test mobile layout at 375px width.
- Verify all API routes return proper status codes and no embedding leakage.

## Post‑Fix Checklist
- [ ] BUG‑01 fixed – session persists on back navigation.
- [ ] BUG‑02 fixed – role‑based UI differences present.
- [ ] BUG‑03 fixed – onboarding gate works both ways.
- [ ] BUG‑04 fixed – signed‑in users redirected from landing.
- [ ] All security & performance checks pass.
- [ ] No console errors or crashes on empty data.
- [ ] Admin dashboard link visible for COLLEGE_ADMIN.
- [ ] Account deletion cleans Clerk & DB.

---
*Please review the plan and approve so we can start applying the changes.*
