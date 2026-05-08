'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <h1 className="page-title">Welcome to CampusBridge</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to complete your profile and unlock mentorship, events, and more.</p>
        </div>
        <SignIn routing="path" path="/sign-in" redirectUrl="/onboarding" />
      </div>
    </div>
  );
}
