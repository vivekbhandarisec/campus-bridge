import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedPage = createRouteMatcher([
  '/dashboard(.*)',
  '/feed(.*)',
  '/match(.*)',
  '/events(.*)',
  '/messages(.*)',
  '/leaderboard(.*)',
  '/orbit(.*)',
  '/search(.*)',
  '/settings(.*)',
  '/admin(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  if (!userId && isProtectedPage(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
