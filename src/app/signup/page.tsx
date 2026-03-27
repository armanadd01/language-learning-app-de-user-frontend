'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GraduationCap, Mail, Lock, Check, Apple, User } from 'lucide-react';

import { setToken } from '@/lib/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-[var(--card)] p-12 border-r border-border">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-foreground">DeutschPath</div>
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-extrabold leading-tight text-foreground">
                Master German
                <span className="block text-[var(--primary)]">Step by Step.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Join over 50,000 students achieving fluency through our Goethe-aligned structured learning paths.
              </p>
            </div>

            <div className="mt-10 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>Structured A0–C2 levels</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>AI-powered pronunciation feedback</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>Immersive cultural games</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>Recognized by major institutions</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full bg-[var(--muted)] ring-2 ring-[var(--card)]" />
                <div className="h-7 w-7 rounded-full bg-[var(--muted)] ring-2 ring-[var(--card)]" />
                <div className="h-7 w-7 rounded-full bg-[var(--muted)] ring-2 ring-[var(--card)]" />
              </div>
              <div className="text-xs font-medium text-foreground">+12k learners</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              “The best investment in my career since moving to Berlin.”
            </p>
            <p className="mt-2 text-xs font-semibold text-foreground">— Elena R., Senior Developer</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="mt-4 text-lg font-semibold text-foreground">DeutschPath</div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Create Account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start your journey to German mastery</p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Display Name</div>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    type="text"
                    required
                    placeholder="Your name"
                    className="h-11 pl-10 bg-[var(--card)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Email Address</div>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="h-11 pl-10 bg-[var(--card)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Password</div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="h-11 pl-10 bg-[var(--card)]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
                />
                <span>
                  By creating an account, you agree to our Terms of Use and Privacy Policy.
                </span>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                disabled={loading || !agree}
                type="submit"
                className="w-full h-11 rounded-xl shadow-sm"
              >
                {loading ? 'Creating…' : 'Register'}
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <div className="text-[10px] font-semibold text-muted-foreground">OR CONTINUE WITH</div>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-11">
                  Google
                </Button>
                <Button type="button" variant="outline" className="h-11">
                  <Apple className="mr-2 h-4 w-4" />
                  Apple
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={() => router.push('/login')} className="font-semibold text-[var(--primary)] hover:underline">
                  Sign in
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
