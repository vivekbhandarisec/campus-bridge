'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { CalendarDays, Gauge, Home, Medal, MessageSquare, Search, Settings, Sparkles, UserCircle, Users } from 'lucide-react';
import type { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function Navbar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const links: Array<{ href: string; label: string; icon: typeof Home; roles?: Role[] }> = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/dashboard', label: 'Mentor Hub', icon: Gauge, roles: ['ALUMNI'] },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/match', label: 'Match', icon: Users, roles: ['STUDENT'] },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/leaderboard', label: 'CampusCred', icon: Medal, roles: ['STUDENT', 'ALUMNI'] },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/college', label: 'Organizer', icon: Gauge, roles: ['COLLEGE_ADMIN'] },
    { href: '/settings/profile', label: 'Profile', icon: UserCircle },
  ];
  const visibleLinks = links.filter((link) => !link.roles || (role && link.roles.includes(role)));

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-soft">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/feed" className="flex items-center gap-3 font-heading text-lg font-bold tracking-[-0.02em] text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-primary-500 to-primary-600 text-sm text-white shadow-premium">CB</span>
          <span className="hidden sm:inline bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">CampusBridge</span>
        </Link>

        <nav className="hidden items-center rounded-xl border border-white/20 bg-white/60 backdrop-blur-md p-1 text-sm font-semibold lg:flex">
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[9px] px-3 py-2 text-slate-600 transition-all duration-300 hover:bg-white/80 hover:shadow-soft',
                  active && 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-premium',
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
            {role === 'STUDENT' && (
              <Link href="/match" prefetch={false} className="hidden items-center gap-2 rounded-[10px] border border-primary-500/15 bg-gradient-to-r from-primary-50 to-primary-100 px-3 py-2 text-sm font-semibold text-primary-600 transition-all duration-300 hover:shadow-premium md:inline-flex">
                <Sparkles className="h-4 w-4" />
                AI Match
              </Link>
            )}
            <Link href="/settings/profile" prefetch={false} className="hidden h-10 w-10 place-items-center rounded-[10px] border border-slate-200/50 bg-white/80 backdrop-blur-sm text-slate-500 transition-all duration-300 hover:text-primary-500 hover:shadow-soft md:grid" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonBox: 'h-10 w-10 rounded-full',
                  userButtonTrigger: 'rounded-full ring-2 ring-transparent transition hover:ring-primary-500 focus:shadow-none',
                  userButtonAvatarBox: 'h-10 w-10 rounded-full border border-slate-200 shadow-premium',
                  userButtonPopoverCard: 'rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-luxury',
                  userButtonPopoverActionButton: 'text-slate-700 hover:bg-slate-50',
                  userButtonPopoverActionButtonText: 'text-sm font-semibold',
                  userButtonPopoverFooter: 'hidden',
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="premium-button">Sign in</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
