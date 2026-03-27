'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { BookOpen, CircleCheck, Lock } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Lesson = {
  _id: string
  title: string
  order: number
  status?: 'locked' | 'available' | 'completed'
  isCurrent?: boolean
}

type Module = {
  _id: string
  title: string
  description?: string
  order: number
  status?: 'locked' | 'available' | 'completed'
  isCurrent?: boolean
}

type LessonsResponse = { lessons: Lesson[] }

type ModuleResponse = { module?: Module }

export default function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const moduleId = params.moduleId

  const hasToken = useHasToken()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [moduleMeta, setModuleMeta] = useState<Module | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalLessons = lessons.length
  const completedLessons = useMemo(() => lessons.filter((l) => l.status === 'completed').length, [lessons])
  const currentLesson = useMemo(
    () => lessons.find((l) => l.isCurrent) ?? lessons.find((l) => l.status === 'available') ?? null,
    [lessons]
  )
  const moduleProgressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const continueHref = currentLesson ? `/lessons/${currentLesson._id}?moduleId=${moduleId}` : `/modules/${moduleId}`

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false)
        return
      }

      if (!moduleId || moduleId === 'undefined') {
        setError('Invalid module ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const lessonsData = await apiFetch<LessonsResponse>(`/content/modules/${moduleId}/lessons`)
        setLessons(lessonsData.lessons)

        try {
          const meta = await apiFetch<ModuleResponse>(`/content/modules/${moduleId}`)
          if (meta?.module) setModuleMeta(meta.module)
        } catch {
          setModuleMeta(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken, moduleId])

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-muted-foreground">
            <span className="text-muted-foreground">Learning Path</span>
            <span className="mx-2">›</span>
            <span className="text-muted-foreground">Modules</span>
            <span className="mx-2">›</span>
            <span className="text-foreground">{moduleMeta ? moduleMeta.title : 'Module'}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-foreground)]">
              MODULE {moduleMeta?.order ?? ''}
            </div>
          </div>
        </div>

        <Button variant="outline" asChild className="h-10 shrink-0">
          <Link href="/modules">Back</Link>
        </Button>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
            <BookOpen className="h-6 w-6 text-[var(--accent-foreground)]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">You need to login to access lessons.</p>
          <Button asChild className="mt-6">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}

      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {hasToken && !loading && !error && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-extrabold text-foreground">{moduleMeta ? moduleMeta.title : 'Module Lessons'}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{moduleMeta?.description ?? 'Transition from basics into real-life practice with structured lessons.'}</p>

                    <Button asChild className="mt-5 h-10">
                      <Link href={continueHref}>Continue Learning</Link>
                    </Button>
                  </div>

                  <div className="shrink-0">
                    <div className="flex items-center justify-center">
                      <div
                        className="relative flex h-24 w-24 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(var(--primary) ${moduleProgressPct}%, var(--muted) 0)`,
                        }}
                      >
                        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[var(--card)] text-sm font-extrabold text-foreground">
                          {completedLessons}/{Math.max(1, totalLessons)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">LESSONS DONE</div>
                  </div>
                </div>
              </Card>

              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Your Roadmap</div>
                  <div className="text-xs text-muted-foreground">{totalLessons} Lessons</div>
                </div>

                <div className="mt-4 space-y-3">
                  {lessons.map((l) => {
                    const locked = l.status === 'locked'
                    const completed = l.status === 'completed'
                    const inProgress = l.isCurrent || (!completed && !locked)
                    const pill = completed
                      ? 'bg-[var(--muted)] text-foreground'
                      : inProgress
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'bg-[var(--muted)] text-muted-foreground'

                    return (
                      <Card key={l._id} className={locked ? 'p-4 opacity-60' : 'p-4'}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5">
                              {completed ? (
                                <CircleCheck className="h-5 w-5 text-[var(--primary)]" />
                              ) : locked ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-foreground)]">
                                  {l.order}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-bold text-foreground">{l.title}</div>
                                <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill}`}>
                                  {completed ? 'Completed' : inProgress ? 'In Progress' : 'Locked'}
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">~15 min</div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {completed ? (
                              <Button asChild variant="outline" className="h-9">
                                <Link href={`/lessons/${l._id}?moduleId=${moduleId}`}>Review</Link>
                              </Button>
                            ) : (
                              <Button asChild className="h-9" disabled={locked}>
                                <Link href={locked ? '#' : `/lessons/${l._id}?moduleId=${moduleId}`}>Start</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {lessons.length === 0 ? (
                <Card className="mt-2 p-8 text-center">
                  <h2 className="text-lg font-bold text-foreground">No lessons found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">This module does not have any lessons yet.</p>
                </Card>
              ) : null}
            </div>

            <div className="space-y-4">
              <Card className="p-5 bg-[var(--card)]">
                <div className="text-sm font-bold text-foreground">Learning Objectives</div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                      <span>{i === 0 ? 'Discuss daily schedules and work routines fluently.' : i === 1 ? 'Use reflexive verbs in the present tense.' : 'Express precise time and handle appointments.'}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-bold text-foreground">Prerequisites</div>
                <div className="mt-3 space-y-2">
                  {['Verb Conjugation', 'Basic Sentence Order', 'Subject Pronouns'].map((t) => (
                    <div key={t} className="rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-xs font-semibold text-muted-foreground">
                      {t}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-[var(--card)]">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--primary)]">Practice Center</div>
                <div className="mt-2 text-sm font-bold text-foreground">Reinforce with Games</div>
                <div className="mt-2 text-xs text-muted-foreground">Play short games to earn bonus XP and strengthen your accuracy.</div>
                <Button asChild variant="outline" className="mt-4 h-10 w-full">
                  <Link href="/games">Open Game Hub →</Link>
                </Button>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-bold text-foreground">Module Statistics</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Lessons</div>
                    <div className="mt-1 text-lg font-extrabold text-foreground">{totalLessons}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                    <div className="mt-1 text-lg font-extrabold text-foreground">{completedLessons}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Progress</div>
                    <div className="mt-1 text-lg font-extrabold text-foreground">{moduleProgressPct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Potential XP</div>
                    <div className="mt-1 text-lg font-extrabold text-foreground">+{totalLessons * 50}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
