'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { colleges, domains, roles, skillsOptions } from '@/lib/profile-options';

interface ProfileSettingsFormProps {
  user: {
    name: string;
    email: string;
    role: string;
    college: string;
    branch: string | null;
    graduationYear: number | null;
    bio: string | null;
    skills: string[];
    domain: string | null;
    currentCompany: string | null;
    isAvailable: boolean;
  };
}

async function readErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) return 'Request failed';

  try {
    const errorData = JSON.parse(text);
    return errorData?.message || 'Request failed';
  } catch {
    return text;
  }
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [college, setCollege] = useState(user.college || '');
  const [branch, setBranch] = useState(user.branch || '');
  const [graduationYear, setGraduationYear] = useState(String(user.graduationYear || ''));
  const [domain, setDomain] = useState(user.domain || '');
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [bio, setBio] = useState(user.bio || '');
  const [currentCompany, setCurrentCompany] = useState(user.currentCompany || '');
  const [isAvailable, setIsAvailable] = useState(user.isAvailable);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  };

  const validate = () => {
    if (!college) return 'Choose your college.';
    if (!domain) return 'Choose your focus area.';
    if (skills.length === 0) return 'Select at least one skill.';
    if (role !== 'COLLEGE_ADMIN' && !branch.trim()) return 'Enter your branch.';
    if (role === 'ALUMNI' && !currentCompany.trim()) return 'Enter your current company.';
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          college,
          branch,
          graduationYear: graduationYear ? Number(graduationYear) : undefined,
          domain,
          skills,
          bio,
          currentCompany: role === 'ALUMNI' ? currentCompany : undefined,
          isAvailable: role === 'ALUMNI' ? isAvailable : true,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setMessage('Profile updated.');
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete your CampusBridge account? This removes your profile, posts, messages, and registrations.');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/users/profile', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      window.location.href = '/';
    } catch (error) {
      setError((error as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Profile</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit your CampusBridge profile</h1>
          <p className="mt-2 text-sm text-slate-500">Keep this accurate so matching and recommendations reflect you.</p>
        </div>

        <div className="mt-8 space-y-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input value={user.name} disabled aria-label="Name" />
            <Input value={user.email} disabled aria-label="Email" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {roles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-3xl border px-4 py-3 text-left text-sm ${role === option.value ? 'border-brand-600 bg-white text-slate-900 shadow-sm' : 'border-slate-200 bg-slate-100 text-slate-600'}`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">College</label>
              <Select value={college} onChange={(event) => setCollege(event.target.value)}>
                <option value="">Choose your college</option>
                {colleges.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Focus area</label>
              <Select value={domain} onChange={(event) => setDomain(event.target.value)}>
                <option value="">Choose your focus area</option>
                {domains.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
          </div>

          {role !== 'COLLEGE_ADMIN' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Branch</label>
                <Input value={branch} onChange={(event) => setBranch(event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Graduation year</label>
                <Select value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)}>
                  <option value="">Choose year</option>
                  {Array.from({ length: 12 }, (_, index) => {
                    const year = 2020 + index;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </Select>
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full border px-3 py-2 text-sm ${skills.includes(skill) ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {role === 'ALUMNI' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Current company</label>
                <Input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setIsAvailable((value) => !value)}
                  className={`h-12 w-full rounded-2xl px-4 text-sm font-semibold ${isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  {isAvailable ? 'Available to mentor' : 'Not available'}
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Bio</label>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
          <p className="mt-2 text-sm text-slate-500">Deleting your account removes your CampusBridge profile and signs you out.</p>
          <Button onClick={handleDelete} disabled={deleting} className="mt-5 w-full bg-rose-600 hover:bg-rose-700">
            {deleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </aside>
    </div>
  );
}
