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
  index: number
  sentence: string
  options: string[]
  correct: string
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

export default function GrammarCorrectionGame() {
  const hasToken = useMemo(() => Boolean(getToken()), [])
  const [game, setGame] = useState<GameData | null>(null)
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse['result'] | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiFetch<GameResponse>('/games/grammar-correction?count=5')
        setGame(res.game)
        setSelections({})
        setResult(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    if (hasToken) load()
    else setLoading(false)
  }, [hasToken])

  async function submit() {
    if (!game) return

    const total = game.items.length
    if (Object.keys(selections).length < total) {
      setError(`Please answer all ${total} items.`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const selectionsArr = game.items.map((it) => ({
        index: it.index,
        answer: selections[it.index] ?? '',
        correct: it.correct,
      }))

      const res = await apiFetch<SubmitResponse>('/games/grammar-correction/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: selectionsArr }),
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

  if (!game) return null

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Grammar Correction</div>
          <div className="mt-1 text-sm font-bold text-foreground">Choose the corrected sentence</div>
        </div>
        <Button variant="outline" asChild className="h-10 shrink-0">
          <Link href="/games">Back</Link>
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="mt-6 space-y-4">
        {game.items.map((it) => (
          <Card key={it.index} className="p-5">
            <div className="text-xs font-semibold text-muted-foreground">Incorrect</div>
            <div className="mt-2 text-sm font-bold text-foreground">{it.sentence}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {it.options.map((opt) => {
                const active = selections[it.index] === opt
                return (
                  <Button
                    key={opt}
                    variant={active ? 'primary' : 'outline'}
                    className="h-auto min-h-12 justify-start text-left"
                    onClick={() => {
                      if (result) return
                      setSelections((s) => ({ ...s, [it.index]: opt }))
                    }}
                  >
                    {opt}
                  </Button>
                )
              })}
            </div>
          </Card>
        ))}

        <div className="flex items-center gap-3">
          <Button className="h-10 bg-cyan-500 hover:bg-cyan-600 text-white" disabled={submitting || Boolean(result)} onClick={submit}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
          <Button variant="outline" className="h-10" onClick={() => window.location.reload()}>
            New Game
          </Button>
          {result ? (
            <div className="ml-auto text-sm text-muted-foreground">
              {result.correctCount}/{result.total} correct — +{result.xpEarned} XP
            </div>
          ) : null}
        </div>

        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="font-semibold">{result.message}</div>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
