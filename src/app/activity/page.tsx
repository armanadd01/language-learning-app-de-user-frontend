'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type SummaryResponse = {
  stats: { xpTotal: number; streakDays: number; lastActivityAt?: string }
  progress: null | {
    completedLessonsCount: number
    completedActivitiesCount: number
    overallProgress: number
    currentModuleId: string | null
    currentLessonId: string | null
  }
  metrics?: { xpToday?: number; avgAccuracy?: number | null }
  badges: Array<{ id: string; title: string; description: string }>
  recent: Array<{
    id: string
    createdAt: string
    xpEarned: number
    correctCount: number
    total: number
    activity?: null | { type: string; prompt: string; parentType: string }
  }>
}

export default function ActivityPage() {
  const hasToken = useHasToken()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<SummaryResponse>(`/me/summary?courseSlug=german-goethe`)
        setSummary(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Your Progress Journey</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your recent activities, analyze performance trends, and identify areas for improvement.
        </p>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to view your activity and progress analytics.</p>
          <Button asChild className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}
      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {hasToken && !loading && !error && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Avg. Accuracy</div>
            <div className="mt-1 text-lg font-bold text-foreground">
              {summary?.metrics?.avgAccuracy == null ? '—' : `${Math.round(summary.metrics.avgAccuracy * 100)}%`}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Based on recent attempts</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">XP Today</div>
            <div className="mt-1 text-lg font-bold text-foreground">{summary?.metrics?.xpToday ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">Daily progress</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Completed</div>
            <div className="mt-1 text-lg font-bold text-foreground">{summary?.progress?.completedLessonsCount ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">Lessons</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground">Achievements</div>
            <div className="mt-1 text-lg font-bold text-foreground">{summary?.badges?.length ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">Badges</div>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <div className="text-sm font-bold text-foreground">XP Earnings Trend</div>
          <div className="mt-2 text-xs text-muted-foreground">Visualizing your learning consistency over the last 10 sessions</div>
          <div className="mt-4 h-56 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40" />
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-sm font-bold text-foreground">Skill Distribution</div>
            <div className="mt-2 text-xs text-muted-foreground">Balanced proficiency overview</div>
            <div className="mt-4 h-56 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40" />
          </Card>

          <Card className="p-5">
            <div className="text-sm font-bold text-foreground">Weak Areas</div>
            <div className="mt-2 text-xs text-muted-foreground">Focus points for next session</div>
            <div className="mt-4 space-y-3">
              {[{ t: 'Dative Case Pronouns', a: '42% accuracy', tag: 'critical' }, { t: 'Past Participles (Ge-)', a: '68% accuracy', tag: 'warning' }, { t: 'Adjective Endings', a: '74% accuracy', tag: 'warning' }].map((w) => (
                <div key={w.t} className="rounded-xl border border-border bg-white/60 p-3 text-xs dark:bg-zinc-950/30">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-foreground">{w.t}</div>
                    <div className={w.tag === 'critical' ? 'rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200' : 'rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200'}>
                      {w.tag}
                    </div>
                  </div>
                  <div className="mt-2 text-muted-foreground">{w.a}</div>
                </div>
              ))}
            </div>
            <button className="mt-4 h-10 w-full rounded-xl bg-cyan-500 text-sm font-semibold text-white hover:bg-cyan-600">Practice Weak Areas</button>
          </Card>

          <Card className="p-5 bg-amber-50/70 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900">
            <div className="text-sm font-bold text-foreground">Protect Your Streak!</div>
            <div className="mt-2 text-xs text-muted-foreground">Earn 25 more XP today to maintain your momentum.</div>
            <button className="mt-4 h-10 w-full rounded-xl bg-amber-500 text-sm font-semibold text-white hover:bg-amber-600">Start a Lesson</button>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-base font-bold text-foreground">Activity Log</div>
        {hasToken && !loading && !error && summary?.recent?.length ? (
          <div className="mt-4 space-y-3">
            {summary.recent.slice(0, 12).map((a) => (
              <Card key={a.id} className="p-4">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  {a.activity?.parentType ? a.activity.parentType.toUpperCase() : 'ATTEMPT'}
                </div>
                <div className="mt-1 text-sm font-bold text-foreground">{a.activity?.prompt ?? 'Practice attempt'}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()} • +{a.xpEarned} XP • {a.correctCount}/{a.total}
                </div>
              </Card>
            ))}
          </div>
        ) : hasToken && !loading && !error ? (
          <div className="mt-4 text-sm text-muted-foreground">No activity yet. Complete a lesson or play a game to start building your history.</div>
        ) : null}
        <button className="mt-6 h-10 w-full rounded-xl border border-border bg-white/60 text-sm font-semibold text-muted-foreground hover:bg-zinc-100 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40">Load Older Activities</button>
      </div>
    </AppShell>
  )
}
