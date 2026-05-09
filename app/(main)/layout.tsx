import { Navbar } from '@/components/navbar';
import { PageShell } from '@/components/layout/PageShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-6">
        <PageShell>
          {children}
        </PageShell>
      </main>
    </div>
  );
}
