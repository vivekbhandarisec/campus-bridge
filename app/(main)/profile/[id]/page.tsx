import Link from 'next/link';
import prisma from '@/lib/prisma';
import { CredBadge } from '@/components/cred-badge';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, campusCredBadge } from '@/lib/utils';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { posts: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-700">
        User not found.
      </div>
    );
  }

  const tier = campusCredBadge(user.campusCred);

  return (
    <div className="grid gap-8 xl:grid-cols-[320px_minmax(640px,_1fr)]">
      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <Avatar src={user.avatarUrl} name={user.name} className="mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900">{user.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{user.college}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {user.skills.map((skill) => (
              <Badge key={skill} className="bg-slate-100 text-slate-700">{skill}</Badge>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">CampusCred</p>
            <p className="text-3xl font-semibold text-slate-900">{user.campusCred}</p>
            <span className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-semibold ${tier.className}`}>{tier.label}</span>
          </div>
          <div className="mt-6 space-y-2 text-left text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Domain</p>
              <p>{user.domain || 'Not specified'}</p>
            </div>
            {user.currentCompany ? (
              <div>
                <p className="font-semibold text-slate-900">Company</p>
                <p>{user.currentCompany}</p>
              </div>
            ) : null}
            {user.bio ? (
              <div>
                <p className="font-semibold text-slate-900">Bio</p>
                <p>{user.bio}</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Profile overview</h2>
              <p className="text-sm text-slate-500">{user.role} · {user.branch || 'Branch not set'} · Grad {user.graduationYear || 'N/A'}</p>
            </div>
            <Link href="/messages" className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Message
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">LinkedIn</p>
              <p className="mt-2 text-sm text-slate-900">{user.linkedinUrl || 'Not linked'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">GitHub</p>
              <p className="mt-2 text-sm text-slate-900">{user.githubUrl || 'Not linked'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recent posts</h2>
          <div className="mt-4 space-y-4">
            {user.posts.length > 0 ? (
              user.posts.map((post) => (
                <article key={post.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">{post.content}</p>
                  <p className="mt-3 text-xs text-slate-500">{formatDate(post.createdAt)}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No posts yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
