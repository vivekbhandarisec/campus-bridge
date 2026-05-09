import { Navbar } from '@/components/navbar';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedRouteWarmup } from '@/components/optimized-route-warmup';
import { MainLayoutClient } from './MainLayoutClient';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MainLayoutClient>
        <main className="py-6">
          <PageShell>
            {children}
          </PageShell>
        </main>
      </MainLayoutClient>
    </div>
  );
}
