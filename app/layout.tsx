import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { SessionRefresh } from '@/components/session-refresh';
import { UserProvider } from '@/contexts/UserContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { PageTransition } from '@/components/page-transition';
import './globals.css';

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: 'CampusBridge',
  description: 'CampusBridge connects engineering students, alumni, and colleges with AI-powered mentoring and events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!clerkPublishableKey) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
            <h1 className="text-3xl font-semibold">Clerk configuration missing</h1>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in <code>.env.local</code> or your environment and restart the app.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Example:</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
              </pre>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ErrorBoundary>
            <UserProvider>
              <PageTransition>
                <SessionRefresh>{children}</SessionRefresh>
              </PageTransition>
            </UserProvider>
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
