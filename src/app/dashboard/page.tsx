'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Flame,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';

import { apiFetch } from '@/lib/api';
import { clearToken, useHasToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';

type Level = { _id: string; code: string; title: string; description?: string; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };
type Module = { _id: string; title: string; description?: string; order: number; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };
type Lesson = { _id: string; title: string; order: number; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };

type LevelsResponse = { levels: Level[] };

type SummaryResponse = {
  stats: { xpTotal: number; streakDays: number; lastActivityAt?: string };
  progress: null | {
    completedLessonsCount: number;
    completedActivitiesCount: number;
    overallProgress: number;
    currentModuleId: string | null;
    currentLessonId: string | null;
  };
  metrics?: { xpToday?: number; avgAccuracy?: number | null };
  badges: Array<{ id: string; title: string; description: string }>;
  recent: Array<{ id: string; createdAt: string; xpEarned: number; correctCount: number; total: number }>;
};

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const hasToken = useHasToken();

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const summaryData = await apiFetch<SummaryResponse>(`/me/summary?courseSlug=german-goethe`);
        setSummary(summaryData);

        const levelsData = await apiFetch<LevelsResponse>(`/content/levels?courseSlug=german-goethe`);
        setLevels(levelsData.levels);

        // Only load modules and lessons if we have unlocked content
        const firstUnlockedLevel = levelsData.levels.find(l => l.status !== 'locked');
        if (!firstUnlockedLevel) {
          setLoading(false);
          return;
        }

        const modulesData = await apiFetch<{ modules: Module[] }>(`/content/levels/${firstUnlockedLevel._id}/modules`);
        setModules(modulesData.modules);

        const firstUnlockedModule = modulesData.modules.find(m => m.status !== 'locked');
        if (!firstUnlockedModule) {
          setLoading(false);
          return;
        }

        const lessonsData = await apiFetch<{ lessons: Lesson[] }>(`/content/modules/${firstUnlockedModule._id}/lessons`);
        setLessons(lessonsData.lessons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hasToken]);

  // Weekly activity from recent attempts
  const weeklyActivity = useMemo(() => {
    if (!summary?.recent) return []
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      dayMap.set(weekDays[i], 0)
    }
    summary.recent.forEach((a) => {
      const date = new Date(a.createdAt)
      if (date >= weekStart) {
        const day = weekDays[date.getDay()]
        dayMap.set(day, (dayMap.get(day) ?? 0) + a.xpEarned)
      }
    })
    const max = Math.max(...Array.from(dayMap.values()), 1)
    return Array.from(dayMap.entries()).map(([day, xp]) => ({ day, xp, height: Math.round((xp / max) * 80) }))
  }, [summary?.recent])

  // Recent badges with mock timestamps (since we don’t store earnedAt yet)
  const recentBadges = useMemo(() => {
    if (!summary?.badges) return []
    const now = new Date()
    return summary.badges.slice(-3).reverse().map((b, i) => {
      const daysAgo = i === 0 ? 2 : i === 1 ? 7 : 30
      const d = new Date(now)
      d.setDate(d.getDate() - daysAgo)
      return { title: b.title, date: d.toLocaleString(undefined, { month: 'short', day: 'numeric' }) }
    })
  }, [summary?.badges])

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Welcome back</div>
          <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="flex gap-3">
          {!hasToken ? (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                clearToken();
                window.location.href = '/login';
              }}
            >
              Logout
            </Button>
          )}
        </div>
      </div>

      {loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!hasToken && (
        <Card className="mt-10 p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Login Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to access your German learning dashboard.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && !loading && !error && levels.length === 0 && (
        <Card className="mt-10 p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">No Content Available</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please run the backend seed script to populate the database with German learning content.</p>
        </Card>
      )}

      {hasToken && !loading && !error && levels.length > 0 && (
        <>
          <Card className="mt-8 p-6 bg-[var(--card)]">
            <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-foreground)]">
                  <Flame className="h-4 w-4" />
                  Welcome back!
                </div>
                <h2 className="mt-4 text-2xl font-extrabold text-foreground">Keep the momentum going.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You&apos;ve earned <span className="font-semibold text-foreground">{summary?.metrics?.xpToday ?? 0} XP</span> today.
                  {summary?.stats?.streakDays ? (
                    <span> Your current streak is <span className="font-semibold text-foreground">{summary.stats.streakDays} days</span>.</span>
                  ) : null}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/modules">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-white/20">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      Continue Learning
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/levels">View Roadmap</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-[var(--card)] p-5">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent)]">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-foreground">{Math.round(summary?.progress?.overallProgress ?? 0)}%</div>
                    <div className="text-[10px] font-semibold text-muted-foreground">OVERALL</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground">XP Total</div>
                  <div className="mt-1 text-xs text-muted-foreground">{summary?.stats?.xpTotal ?? 0} XP</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Current Streak</div>
                  <div className="mt-1 text-lg font-bold text-foreground">{summary?.stats?.streakDays ?? 0} Days</div>
                  <div className="mt-1 text-xs text-muted-foreground">Keep it alive by earning XP daily</div>
                </div>
                <div className="rounded-xl bg-[var(--muted)] p-2 text-[var(--foreground)]">
                  <Flame className="h-4 w-4" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">XP Earned</div>
                  <div className="mt-1 text-lg font-bold text-foreground">{summary?.stats?.xpTotal ?? 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{summary?.metrics?.xpToday ?? 0} XP today</div>
                </div>
                <div className="rounded-xl bg-[var(--accent)] p-2 text-[var(--accent-foreground)]">
                  <Star className="h-4 w-4" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Average Accuracy</div>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {summary?.metrics?.avgAccuracy == null ? '—' : `${Math.round(summary.metrics.avgAccuracy * 100)}%`}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Based on recent attempts</div>
                </div>
                <div className="rounded-xl bg-[var(--muted)] p-2 text-[var(--foreground)]">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Lessons Done</div>
                  <div className="mt-1 text-lg font-bold text-foreground">{summary?.progress?.completedLessonsCount ?? 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Completed lessons</div>
                </div>
                <div className="rounded-xl bg-[var(--muted)] p-2 text-[var(--foreground)]">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Recommended Next</h3>
                <button type="button" className="text-xs font-semibold text-[var(--primary)] hover:underline">See all modules</button>
              </div>

              <Card className="mt-4 overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="h-36 bg-[var(--muted)]" />
                  <div className="p-5">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      {modules.length > 0 ? `MODULE ${modules[0].order || 1} • LESSON ${lessons[0]?.order || 1}` : 'LESSON'}
                    </div>
                    <div className="mt-1 text-sm font-bold text-foreground">{lessons[0]?.title ?? 'Continue Learning'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {lessons[0]?.title ? 'Pick up where you left off and keep building momentum.' : 'Start your next lesson to keep your streak alive.'}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>15 min</span>
                        <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> +50 XP</span>
                      </div>
                      {lessons[0]?._id ? (
                        <Button asChild className="h-9">
                          <Link href={`/lessons/${lessons[0]._id}`}>
                            Start Lesson <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button className="h-9">
                          Start Lesson <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <h3 className="mt-8 text-base font-bold text-foreground">Continue Modules</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {modules.slice(0, 4).map((m) => (
                  <Card key={m._id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[var(--accent)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-foreground">{m.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{lessons.length} Lessons</div>
                        <div className="mt-3 h-2 w-full rounded-full bg-[var(--muted)]">
                          <div
                            className="h-2 rounded-full bg-[var(--primary)]"
                            style={{ width: `${Math.min(100, Math.round(((lessons.filter(l => l.status === 'completed').length) / Math.max(1, lessons.length)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Weekly Activity</div>
                  <button type="button" className="text-xs font-semibold text-[var(--primary)] hover:underline">Full Stats</button>
                </div>
                <div className="mt-4 grid grid-cols-7 items-end gap-2">
                  {weeklyActivity.map(({ day, height }) => (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div className="w-full rounded-full bg-[var(--primary)]/70" style={{ height: `${height}px` }} />
                      <div className="text-[10px] text-muted-foreground">{day.slice(0, 3)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    <div>Total this week</div>
                    <div className="font-semibold text-foreground">{weeklyActivity.reduce((sum, { xp }) => sum + xp, 0)} XP</div>
                  </div>
                  <div className="text-right">
                    <div>Active days</div>
                    <div className="font-semibold text-foreground">{weeklyActivity.filter(({ xp }) => xp > 0).length}/7 Days</div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Recent Badges</div>
                  <button type="button" className="text-xs font-semibold text-[var(--primary)] hover:underline">All Badges</button>
                </div>
                <div className="mt-4 space-y-3">
                  {recentBadges.map((b) => (
                    <div key={b.title} className="flex items-center justify-between rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-xs">
                      <div className="font-semibold text-foreground">{b.title}</div>
                      <div className="text-muted-foreground">{b.date}</div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full h-10">View Collection</Button>
              </Card>

              <Card className="p-5 bg-[var(--card)]">
                <div className="text-sm font-bold text-foreground">Maintain the Spark</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Upgrade to Pro to get double XP every weekend and unlock premium practice hearts.
                </div>
                <Button className="mt-4 w-full h-10">Go Pro Free for 7 Days</Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
