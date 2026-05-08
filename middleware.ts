import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/api/:path*',
    '/feed/:path*',
    '/match/:path*',
    '/events/:path*',
    '/messages/:path*',
    '/leaderboard/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
