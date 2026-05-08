'use client';

import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold text-slate-900">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white">CB</span>
          CampusBridge
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 md:flex">
          <Link href="/feed" className="hover:text-slate-900">Feed</Link>
          <Link href="/match" className="hover:text-slate-900">Match</Link>
          <Link href="/events" className="hover:text-slate-900">Events</Link>
          <Link href="/leaderboard" className="hover:text-slate-900">Leaderboard</Link>
          <Link href="/messages" className="hover:text-slate-900">Messages</Link>
          <Link href="/settings/profile" className="hover:text-slate-900">Profile</Link>
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            <div className="hidden items-center gap-2 md:flex text-slate-600">
              <Settings className="h-4 w-4" />
              <Link href="/settings/profile" className="hover:text-slate-900">Settings</Link>
            </div>
            <UserButton appearance={{ elements: { userButtonBox: 'h-11 w-11 rounded-2xl' } }} />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
