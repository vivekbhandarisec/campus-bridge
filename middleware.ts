import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/feed(.*)',
  '/match(.*)',
  '/events(.*)',
  '/messages(.*)',
  '/leaderboard(.*)',
  '/settings(.*)',
  '/admin(.*)',
  '/profile(.*)',
  '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/',
    '/feed/:path*',
    '/match/:path*',
    '/events/:path*',
    '/messages/:path*',
    '/leaderboard/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/api/:path*',
    '/onboarding',
  ],
};
