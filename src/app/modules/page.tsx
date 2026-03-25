'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Layers, Lock, ChevronRight } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Level = {
  _id: string
  code: string
  title: string
  description?: string
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

type LevelsResponse = { levels: Level[] }

type ModulesResponse = { modules: Module[] }

export default function ModulesPage() {
  const hasToken = useMemo(() => Boolean(getToken()), [])

  const [levels, setLevels] = useState<Level[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)

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

        const levelsData = await apiFetch<LevelsResponse>(`/content/levels?courseSlug=german-goethe`)
        setLevels(levelsData.levels)

        const initialLevel =
          levelsData.levels.find((l) => l.isCurrent) ??
          levelsData.levels.find((l) => l.status && l.status !== 'locked') ??
          levelsData.levels[0] ??
          null

        if (!initialLevel) {
          setSelectedLevelId(null)
          setModules([])
          return
        }

        setSelectedLevelId(initialLevel._id)
        const modulesData = await apiFetch<ModulesResponse>(`/content/levels/${initialLevel._id}/modules`)
        setModules(modulesData.modules)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  async function selectLevel(level: Level) {
    if (!hasToken) return
    if (level.status === 'locked') return

    try {
      setSelectedLevelId(level._id)
      setLoading(true)
      setError(null)
      const modulesData = await apiFetch<ModulesResponse>(`/content/levels/${level._id}/modules`)
      setModules(modulesData.modules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  const selectedLevel = levels.find((l) => l._id === selectedLevelId) ?? null

  return (
    <AppShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Learning Path</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a level and continue where you left off.</p>
        </div>

        <Button asChild variant="outline" className="h-10">
          <Link href="/levels">View levels</Link>
        </Button>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
            <Layers className="h-6 w-6 text-[var(--accent-foreground)]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">You need to login to access modules and lessons.</p>
          <Button asChild className="mt-6">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}

      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {hasToken && !loading && !error && levels.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">No content available</h2>
          <p className="mt-2 text-sm text-muted-foreground">Seed your backend content to view levels and modules.</p>
        </Card>
      ) : null}

      {hasToken && levels.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="p-5">
            <div className="text-sm font-bold text-foreground">Levels</div>
            <div className="mt-4 space-y-2">
              {levels.map((l) => {
                const active = l._id === selectedLevelId
                const locked = l.status === 'locked'

                return (
                  <button
                    key={l._id}
                    type="button"
                    onClick={() => selectLevel(l)}
                    className={
                      active
                        ? 'w-full rounded-2xl border border-border bg-[var(--accent)] px-4 py-3 text-left text-[var(--accent-foreground)]'
                        : locked
                          ? 'w-full rounded-2xl border border-border bg-[var(--card)] px-4 py-3 text-left opacity-60'
                          : 'w-full rounded-2xl border border-border bg-[var(--card)] px-4 py-3 text-left hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                    }
                    disabled={locked}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground">LEVEL {l.code}</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{l.title}</div>
                      </div>
                      {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {l.description ? <div className="mt-2 text-xs text-muted-foreground">{l.description}</div> : null}
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground">Selected Level</div>
                  <div className="mt-1 text-sm font-bold text-foreground">
                    {selectedLevel ? `Level ${selectedLevel.code}: ${selectedLevel.title}` : 'Choose a level'}
                  </div>
                </div>
                <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-foreground)]">
                  {modules.length} modules
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {modules.map((m) => {
                  const locked = m.status === 'locked'

                  return (
                    <Card key={m._id} className={locked ? 'p-5 opacity-60' : 'p-5'}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] font-semibold text-muted-foreground">MODULE {m.order}</div>
                          <div className="mt-1 text-sm font-bold text-foreground">{m.title}</div>
                          {m.description ? <div className="mt-1 text-xs text-muted-foreground">{m.description}</div> : null}
                        </div>
                        {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
                      </div>

                      <Button asChild variant="outline" className="mt-4 h-10 w-full" disabled={locked}>
                        <Link href={locked ? '#' : `/modules/${m._id}`}>Open Module →</Link>
                      </Button>
                    </Card>
                  )
                })}
              </div>

              {modules.length === 0 ? (
                <div className="mt-4 text-sm text-muted-foreground">No modules found for this level.</div>
              ) : null}
            </Card>

            <Card className="p-5 bg-[var(--card)]">
              <div className="text-sm font-bold text-foreground">Stay consistent</div>
              <div className="mt-1 text-xs text-muted-foreground">Complete one module this week to earn a streak shield.</div>
              <Button className="mt-4 h-10">Continue learning</Button>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  )
}
