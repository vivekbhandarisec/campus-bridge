import { PageShell } from '@/components/layout/PageShell';
import { MainLayoutClient } from './MainLayoutClient';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MainLayoutClient>
        <main className="py-6 pb-24 lg:pb-6">
          <PageShell>
            {children}
          </PageShell>
        </main>
      </MainLayoutClient>
    </div>
  );
}
