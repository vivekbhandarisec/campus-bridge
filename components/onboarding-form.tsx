'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, SignedOut, SignedIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { colleges, domains, roles, skillsOptions } from '@/lib/profile-options';

async function readErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) return 'Setup failed';

  try {
    const errorData = JSON.parse(text);
    return errorData?.message || 'Setup failed';
  } catch {
    return text;
  }
}

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [domain, setDomain] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const storageKey = user?.id ? `campusbridge:onboarding:${user.id}` : '';

  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]));
  };

  useEffect(() => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      setStep(data.step ?? 1);
      setRole(data.role ?? 'STUDENT');
      setUsername(data.username ?? '');
      setCollege(data.college ?? '');
      setBranch(data.branch ?? '');
      setGraduationYear(data.graduationYear ?? '');
      setDomain(data.domain ?? '');
      setSkills(Array.isArray(data.skills) ? data.skills : []);
      setBio(data.bio ?? '');
      setCurrentCompany(data.currentCompany ?? '');
      setIsAvailable(data.isAvailable ?? true);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ step, role, username, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable }),
    );
  }, [bio, branch, college, currentCompany, domain, graduationYear, isAvailable, role, skills, step, storageKey, username]);

  const nextStep = () => setStep((current) => Math.min(totalSteps, current + 1));
  const prevStep = () => setStep((current) => Math.max(1, current - 1));
  const totalSteps = role === 'ALUMNI' ? 3 : 2;
  const isFinalStep = step === totalSteps;
  const currentYear = new Date().getFullYear();
  const graduationYears = role === 'ALUMNI'
    ? Array.from({ length: 45 }, (_, index) => currentYear - index)
    : Array.from({ length: 16 }, (_, index) => currentYear + 1 + index);

  const validateProfile = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return 'Pick a username.';
    if (!/^[a-z][a-z0-9_]{2,19}$/i.test(trimmedUsername)) {
      return 'Username must be 3–20 characters, start with a letter, and only include letters, numbers, or underscores.';
    }
    if (!college) return 'Choose your college.';
    if (!domain) return 'Choose your focus area.';
    if (skills.length === 0) return 'Select at least one skill.';
    if (!branch.trim()) return 'Enter your branch.';
    if (role === 'ALUMNI' && !currentCompany.trim()) return 'Enter your current company.';
    const year = Number(graduationYear);
    if (!Number.isFinite(year)) return 'Choose your graduation year.';
    if (role === 'ALUMNI' && year > currentYear) return 'Alumni graduation year must be this year or earlier.';
    if (role === 'STUDENT' && year <= currentYear) return 'Student graduation year must be after the current year.';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateProfile();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          username: username.trim().toLowerCase(),
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

      if (storageKey) window.localStorage.removeItem(storageKey);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-500">Onboarding</p>
          <h1 className="page-title mt-4">Complete your CampusBridge profile</h1>
          <p className="mt-2 text-sm text-slate-500">Set up the right workspace for your role in the college network.</p>
        </div>

        <SignedOut>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700">
            <p>You need to sign in first.</p>
            <div className="mt-4 flex justify-center">
              <Link href="/sign-in" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-sky-500 px-4 text-sm font-semibold text-white shadow-action transition hover:-translate-y-px hover:bg-sky-400">
                Sign in
              </Link>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Step {step} of {totalSteps}</p>
              {step === 1 && (
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">Role</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {roles.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setRole(option.value);
                            setStep((current) => Math.min(current, option.value === 'ALUMNI' ? 3 : 2));
                          }}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${role === option.value ? 'border-sky-500 bg-sky-50 text-sky-500 shadow-sm' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-white'}`}
                        >
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-xs text-slate-500">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-700">{role === 'STUDENT' ? 'Build your student profile to find mentors, join campus events, and climb the CampusCred leaderboard.' : 'Set up your alumni profile to mentor students, share opportunities, and showcase your career journey.'}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Choose your username</label>
                      <Input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="e.g. sam_goyal"
                        required
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        This will be your public handle for search and profile discovery.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input value={user?.fullName || ''} disabled placeholder="Name" />
                      <Input value={userEmail} disabled placeholder="Email" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 pt-4">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">College</label>
                    <Select value={college} onChange={(event) => setCollege(event.target.value)} required>
                      <option value="">Choose your college</option>
                      {colleges.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Branch</label>
                      <Input value={branch} onChange={(event) => setBranch(event.target.value)} required />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Graduation year</label>
                      <Select value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)}>
                        <option value="">Choose year</option>
                        {graduationYears.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Domain</label>
                      <Select value={domain} onChange={(event) => setDomain(event.target.value)} required>
                        <option value="">Choose your focus area</option>
                        {domains.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {skillsOptions.map((skill) => (
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
                  </div>
                </div>
              )}

              {step === 3 && role === 'ALUMNI' && (
                <div className="space-y-6 pt-4">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">Current company</label>
                    <Input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} required />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">Bio</label>
                    <Textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} required />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-teal-600/10 bg-teal-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">Available to mentor</p>
                      <p className="text-sm text-slate-500">Toggle your availability for student matches.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAvailable((value) => !value)}
                      className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold ${isAvailable ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {isAvailable ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {step > 1 && (
                  <Button type="button" onClick={prevStep} className="border border-slate-200 bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200 hover:shadow-none">
                    Back
                  </Button>
                )}
                <Button type="button" onClick={isFinalStep ? handleSubmit : nextStep} disabled={loading}>
                  {isFinalStep ? (loading ? 'Completing...' : 'Complete profile') : 'Next'}
                </Button>
              </div>
              <p className="text-sm text-slate-500">Signed in as {user?.fullName || userEmail}</p>
            </div>
            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          </form>
        </SignedIn>
      </div>
    </div>
  );
}
