'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { dispatchLevelUp } from '@/lib/gamificationEvents'
import type { LevelUpPayload } from '@/components/gamification/LevelUpModal'

type Item = {
  id: number
  translation: string
  shuffled: string[]
  correct: string[]
}

type GameData = {
  type: string
  title: string
  description: string
  xpPerCorrect: number
  items: Item[]
}

type GameResponse = { game: GameData }

type SubmitResponse = {
  result: { correctCount: number; total: number; xpEarned: number; message: string }
  levelUp?: LevelUpPayload
}

export default function SentenceBuilderGame() {
  const hasToken = useMemo(() => Boolean(getToken()), [])
  const [game, setGame] = useState<GameData | null>(null)
  const [arranged, setArranged] = useState<Record<number, string[]>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse['result'] | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiFetch<GameResponse>('/games/sentence-builder?count=5')
        setGame(res.game)
        setArranged({})
        setActiveIndex(0)
        setResult(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const current = game?.items?.[activeIndex] ?? null
  const currentArranged = arranged[activeIndex] ?? []

  function addWord(w: string) {
    if (!game || result) return
    setArranged((s) => ({ ...s, [activeIndex]: [...(s[activeIndex] ?? []), w] }))
  }

  function removeLast() {
    if (!game || result) return
    setArranged((s) => ({ ...s, [activeIndex]: (s[activeIndex] ?? []).slice(0, -1) }))
  }

  async function submit() {
    if (!game) return
    setSubmitting(true)
    setError(null)
    try {
      const answers = game.items.map((it, idx) => ({
        index: idx,
        arranged: arranged[idx] ?? [],
        correct: it.correct,
      }))

      const res = await apiFetch<SubmitResponse>('/games/sentence-builder/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      setResult(res.result)
      if (res.levelUp) dispatchLevelUp(res.levelUp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasToken) {
    return (
      <AppShell>
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">Login required</h1>
          <p className="mt-2 text-sm text-muted-foreground">You need to login to play games and earn XP.</p>
          <Button asChild className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    )
  }

  if (error && !game) {
    return (
      <AppShell>
        <div className="text-sm text-red-700">{error}</div>
      </AppShell>
    )
  }

  if (!game || !current) return null

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sentence Builder</div>
          <div className="mt-1 text-sm font-bold text-foreground">
            {activeIndex + 1}/{game.items.length}
          </div>
        </div>
        <Button variant="outline" asChild className="h-10 shrink-0">
          <Link href="/games">Back</Link>
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Card className="p-6">
            <div className="text-xs font-semibold text-muted-foreground">Translation</div>
            <div className="mt-2 text-lg font-bold text-foreground">{current.translation}</div>
            <div className="mt-4 rounded-2xl border border-border bg-white/60 p-4 text-sm dark:bg-zinc-950/30">
              {currentArranged.length ? currentArranged.join(' ') : 'Tap words below to build the sentence…'}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="outline" type="button" onClick={removeLast} className="h-10">
                Undo
              </Button>
              <Button
                className="ml-auto h-10 bg-cyan-500 hover:bg-cyan-600 text-white"
                disabled={submitting || Boolean(result)}
                onClick={() => setActiveIndex((i) => Math.min(game.items.length - 1, i + 1))}
              >
                Next
              </Button>
            </div>
          </Card>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {current.shuffled.map((w, idx) => (
              <Button key={`${w}-${idx}`} variant="outline" className="h-12" onClick={() => addWord(w)} disabled={Boolean(result)}>
                {w}
              </Button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button className="h-10 bg-cyan-500 hover:bg-cyan-600 text-white" disabled={submitting || Boolean(result)} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
            <Button variant="outline" className="h-10" onClick={() => window.location.reload()}>
              New Game
            </Button>
          </div>

          {result ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="font-semibold">{result.message}</div>
              <div className="mt-2">Result: {result.correctCount}/{result.total} correct — XP earned: {result.xpEarned}</div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Game</div>
            <div className="mt-2 text-xs text-muted-foreground">{game.title}</div>
            <div className="mt-2 text-xs text-muted-foreground">{game.description}</div>
            <div className="mt-3 text-[11px] font-semibold text-muted-foreground">{game.xpPerCorrect} XP per correct</div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
