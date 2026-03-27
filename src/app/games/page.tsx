'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Gamepad2, Headphones, Search, Sparkles, SquarePen, TextCursorInput, Wand2 } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type GameCategory = 'All Games' | 'Grammar' | 'Vocabulary' | 'Syntax' | 'Listening' | 'Writing'

type GameCard = {
  id: string
  title: string
  description: string
  category: Exclude<GameCategory, 'All Games'>
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  xp: number
  href: string
}

type GamesCatalogResponse = { games: GameCard[] }

function gameIcon(id: string) {
  switch (id) {
    case 'find-article':
      return <TextCursorInput className="h-10 w-10 text-[var(--primary)]/60" />
    case 'sentence-builder':
      return <Wand2 className="h-10 w-10 text-[var(--primary)]/60" />
    case 'word-meaning':
      return <BookOpen className="h-10 w-10 text-[var(--primary)]/60" />
    case 'grammar-correction':
      return <Sparkles className="h-10 w-10 text-[var(--primary)]/60" />
    case 'listening-practice':
      return <Headphones className="h-10 w-10 text-[var(--primary)]/60" />
    case 'timed-quiz':
      return <SquarePen className="h-10 w-10 text-[var(--primary)]/60" />
    default:
      return <Gamepad2 className="h-10 w-10 text-[var(--primary)]/60" />
  }
}

export default function GamesHubPage() {
  const hasToken = useHasToken()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GameCategory>('All Games')

  const [games, setGames] = useState<GameCard[]>([])
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
        const res = await apiFetch<GamesCatalogResponse>('/games/catalog')
        setGames(res.games)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games.filter((g) => {
      if (category !== 'All Games' && g.category !== category) return false
      if (!q) return true
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      )
    })
  }, [query, category, games])

  return (
    <AppShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Game Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Level up your skills with interactive challenges.</p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games..."
            className="h-10 w-full rounded-xl border border-border bg-[var(--card)] pl-10 pr-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
            <Gamepad2 className="h-6 w-6 text-[var(--accent-foreground)]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">You need to login to play games and earn XP.</p>
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
          <div className="mt-6 flex flex-wrap gap-2">
            {([
              'All Games',
              ...Array.from(new Set(games.map((g) => g.category)))
            ] as GameCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  c === category
                    ? 'rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)]'
                    : 'rounded-full border border-border bg-[var(--card)] px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {filtered.map((g) => (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]">
                    {gameIcon(g.id)}
                  </div>
                  <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-foreground)]">
                    +{g.xp} XP
                  </div>
                </div>

                <div className="mt-4">
                  <div className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-border bg-[var(--card)] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{g.category}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{g.level}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-foreground">{g.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{g.description}</div>
                </div>

                <Button asChild variant="outline" className="mt-4 h-10 w-full">
                  <Link href={g.href}>Play Now →</Link>
                </Button>
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-5 bg-[var(--card)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Ready to break your streak?</div>
                <div className="mt-1 text-xs text-muted-foreground">Complete 3 games today to earn a Double XP boost for your next lesson!</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-foreground">2/3</div>
                <div className="text-[10px] font-semibold text-muted-foreground">GAMES WON</div>
                <Button className="h-10">Unlock Boost</Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  )
}
