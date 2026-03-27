'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
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

type LevelsResponse = { levels: Level[] }

export default function LevelsPage() {
  const hasToken = useHasToken()
  const [levels, setLevels] = useState<Level[]>([])
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
        const data = await apiFetch<LevelsResponse>(`/content/levels?courseSlug=german-goethe`)
        setLevels(data.levels)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  const unlocked = levels.filter((l) => l.status !== 'locked')
  const locked = levels.filter((l) => l.status === 'locked')

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">German Proficiency Roadmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">Follow our structured curriculum aligned with the CEFR framework.</p>
        </div>

        <Card className="w-80 p-4">
          <div className="text-xs font-semibold text-muted-foreground">Learning Roadmap</div>
          <div className="mt-3 space-y-2">
            {unlocked.slice(0, 4).map((l) => (
              <div key={l._id} className="flex items-center justify-between rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-xs">
                <div className="font-semibold text-foreground">Level {l.code}</div>
                <div className="text-muted-foreground">{l.isCurrent ? 'current' : l.status}</div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-4 h-10 w-full">
            <Link href="/modules">View Modules & Continue</Link>
          </Button>
        </Card>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to view your level roadmap.</p>
          <Button asChild className="mt-6">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}
      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {hasToken && !loading && !error && levels.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {unlocked.map((l, index) => (
              <div key={l._id} className="relative">
                <div className="absolute left-4 top-0 h-full w-px bg-border" />
                <div className="relative pl-10">
                  <div className="absolute left-2 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-[var(--background)] text-[11px] font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <Card className={l.isCurrent ? 'p-5 border-[var(--primary)]' : 'p-5'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground">LEVEL {l.code}</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{l.title}</div>
                        {l.description ? <div className="mt-1 text-xs text-muted-foreground">{l.description}</div> : null}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">{l.status ?? 'available'}</div>
                    </div>
                    <div className="mt-4">
                      <Button asChild className="h-10 w-full">
                        <Link href="/modules">Continue Path →</Link>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {locked.map((l) => (
              <Card key={l._id} className="p-5 opacity-60">
                <div className="text-[11px] font-semibold text-muted-foreground">LEVEL {l.code}</div>
                <div className="mt-1 text-sm font-bold text-foreground">{l.title}</div>
                {l.description ? <div className="mt-2 text-xs text-muted-foreground">{l.description}</div> : null}
                <button className="mt-4 h-10 w-full rounded-xl border border-border bg-[var(--card)] text-sm font-semibold text-muted-foreground">Locked</button>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
