'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { colleges, domains, roles, skillsOptions } from '@/lib/profile-options';

const alumniCapabilities = [
  ...skillsOptions,
  'Mentorship',
  'Interview Prep',
  'Resume Review',
  'Career Guidance',
  'Referrals',
] as const;

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
  const isAlumni = role === 'ALUMNI';
  const isAdmin = role === 'COLLEGE_ADMIN';
  const currentYear = new Date().getFullYear();
  const graduationYears = isAlumni
    ? Array.from({ length: 45 }, (_, index) => currentYear - index)
    : Array.from({ length: 16 }, (_, index) => currentYear + 1 + index);
  const roleMeta = {
    STUDENT: {
      eyebrow: 'Student profile',
      title: 'Edit your student profile',
      description: 'Keep this accurate so mentor matching, events, and recommendations reflect your goals.',
      identityTitle: 'Academic identity',
      focusLabel: 'Focus area',
      skillsLabel: 'Skills',
      bioLabel: 'Bio',
      bioPlaceholder: 'Tell mentors what you are building, learning, or looking for.',
    },
    ALUMNI: {
      eyebrow: 'Alumni mentor profile',
      title: 'Edit your mentor profile',
      description: 'Show students where you can help: career guidance, interview prep, referrals, and domain mentorship.',
      identityTitle: 'Alumni identity',
      focusLabel: 'Mentorship domain',
      skillsLabel: 'Mentorship strengths',
      bioLabel: 'Mentor intro',
      bioPlaceholder: 'Share your experience, what students can ask you about, and how you prefer to mentor.',
    },
    COLLEGE_ADMIN: {
      eyebrow: 'College organizer profile',
      title: 'Edit your college workspace profile',
      description: 'Configure the organizer profile used for event publishing, registrations, and college visibility.',
      identityTitle: 'Institution identity',
      bioLabel: 'College organizer note',
      bioPlaceholder: 'Describe your college community, event focus, or organizer responsibility.',
    },
  }[role as 'STUDENT' | 'ALUMNI' | 'COLLEGE_ADMIN'] ?? {
    eyebrow: 'Profile',
    title: 'Edit your CampusBridge profile',
    description: 'Keep this accurate so matching and recommendations reflect you.',
    identityTitle: 'Identity',
    focusLabel: 'Focus area',
    skillsLabel: 'Skills',
    bioLabel: 'Bio',
    bioPlaceholder: '',
  };

  const skillChoices = Array.from(new Set([
    ...(isAlumni ? alumniCapabilities : skillsOptions),
    ...skills,
  ]));

  const toggleSkill = (skill: string) => {
    setSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  };

  const validate = () => {
    if (!college) return 'Choose your college.';
    if (!isAdmin && !domain) return 'Choose your focus area.';
    if (!isAdmin && skills.length === 0) return 'Select at least one skill.';
    if (!isAdmin && !branch.trim()) return 'Enter your branch.';
    if (isAlumni && !currentCompany.trim()) return 'Enter your current company.';
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
          domain: isAdmin ? null : domain,
          skills: isAdmin ? [] : skills,
          bio,
          currentCompany: isAlumni ? currentCompany : undefined,
          isAvailable: isAlumni ? isAvailable : true,
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{roleMeta.eyebrow}</p>
          <h1 className="page-title mt-2">{roleMeta.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{roleMeta.description}</p>
        </div>

        <div className="mt-8 space-y-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input value={user.name} disabled aria-label="Name" />
            <Input value={user.email} disabled aria-label="Email" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-[13px] font-semibold text-slate-700">Role</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {roles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${role === option.value ? 'border-sky-500 bg-sky-50 text-sky-500 shadow-sm' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-white'}`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Changing role changes the profile fields shown here and how CampusBridge presents you in the network.
            </p>
          </div>

          <div>
            <h2 className="section-title">{roleMeta.identityTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Used for college event ownership and organizer workspace context.' : isAlumni ? 'Used by students to understand your background and mentoring fit.' : 'Used by alumni and event boards to understand your academic context.'}
            </p>
          </div>

          <div className={`grid gap-4 ${isAdmin ? '' : 'sm:grid-cols-2'}`}>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">College</label>
              <Select value={college} onChange={(event) => setCollege(event.target.value)}>
                <option value="">Choose your college</option>
                {colleges.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            {!isAdmin ? (
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">{roleMeta.focusLabel}</label>
                <Select value={domain} onChange={(event) => setDomain(event.target.value)}>
                  <option value="">Choose {isAlumni ? 'mentorship domain' : 'focus area'}</option>
                  {domains.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>

          {!isAdmin ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">{isAlumni ? 'Graduated branch' : 'Branch'}</label>
                <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder={isAlumni ? 'Computer Science, ECE, Mechanical...' : 'Your branch'} />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">{isAlumni ? 'Graduation year' : 'Expected graduation year'}</label>
                <Select value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)}>
                  <option value="">Choose year</option>
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="rounded-2xl border border-teal-600/15 bg-teal-50 p-4">
              <h2 className="section-title">Organizer workspace</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                College organizers use CampusBridge to publish events, monitor registrations, and identify students looking for teams.
              </p>
            </div>
          ) : null}

          {isAlumni ? (
            <div className="grid gap-4 rounded-2xl border border-teal-600/15 bg-teal-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">Current company / role</label>
                <Input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} placeholder="Google, Founder, SDE-II..." />
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable((value) => !value)}
                className={`h-10 rounded-[10px] px-4 text-sm font-semibold ${isAvailable ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {isAvailable ? 'Available to mentor' : 'Not available'}
              </button>
            </div>
          ) : null}

          {!isAdmin ? (
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">{roleMeta.skillsLabel}</label>
              <div className="flex flex-wrap gap-2">
                {skillChoices.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-2 text-[12.5px] font-semibold transition ${skills.includes(skill) ? 'border-sky-500 bg-sky-50 text-sky-500' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-white'}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-slate-700">{roleMeta.bioLabel}</label>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} placeholder={roleMeta.bioPlaceholder} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">
            {isAdmin ? 'Organizer profile tips' : isAlumni ? 'Mentor profile tips' : 'Student profile tips'}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {isAdmin ? (
              <>
                <p>Keep your event focus and outreach details clear so the college workspace feels institution-led.</p>
                <p>Use the note field for what your college wants to promote on CampusBridge.</p>
              </>
            ) : isAlumni ? (
              <>
                <p>Keep company and availability updated. Students see these first in mentor matches.</p>
                <p>Add mentorship strengths like interview prep, referrals, or resume review.</p>
              </>
            ) : (
              <>
                <p>Student profiles work best with accurate branch, graduation year, skills, and domain.</p>
                <p>Your profile embedding powers AI mentor recommendations.</p>
              </>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
          <p className="mt-2 text-sm text-slate-500">Deleting your account removes your CampusBridge profile and signs you out.</p>
          <Button onClick={handleDelete} disabled={deleting} className="mt-5 w-full border border-danger-200 bg-danger-50 text-danger-600 shadow-none hover:bg-danger-50 hover:shadow-none">
            {deleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </aside>
    </div>
  );
}
