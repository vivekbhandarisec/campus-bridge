'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { CalendarDays, Home, Medal, MessageSquare, Settings, Sparkles, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function Navbar() {
  const pathname = usePathname();
  const links = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/match', label: 'Match', icon: Users },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/leaderboard', label: 'Leaders', icon: Medal },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/settings/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-heading text-lg font-bold tracking-[-0.02em] text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-navy text-sm text-white shadow-soft">CB</span>
          <span className="hidden sm:inline">CampusBridge</span>
        </Link>

        <nav className="hidden items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-sm font-semibold lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[9px] px-3 py-2 text-slate-600 transition hover:bg-white hover:text-navy',
                  active && 'bg-white text-sky-500 shadow-soft',
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            <Link href="/match" className="hidden items-center gap-2 rounded-[10px] border border-teal-600/15 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-600 transition hover:bg-white md:inline-flex">
              <Sparkles className="h-4 w-4" />
              AI Match
            </Link>
            <Link href="/settings/profile" className="hidden h-10 w-10 place-items-center rounded-[10px] border border-slate-200 bg-white text-slate-500 transition hover:text-sky-500 md:grid" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>
            <UserButton appearance={{ elements: { userButtonBox: 'h-10 w-10 rounded-full' } }} />
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
