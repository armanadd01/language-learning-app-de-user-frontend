'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Volume2 } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { dispatchLevelUp } from '@/lib/gamificationEvents'
import type { LevelUpPayload } from '@/components/gamification/LevelUpModal'

type Item = {
  index: number
  word: string
  audioUrl?: string | null
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

export default function ListeningPracticeGame() {
  const hasToken = useMemo(() => Boolean(getToken()), [])
  const [game, setGame] = useState<GameData | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse['result'] | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await apiFetch<GameResponse>('/games/listening-practice?count=5')
        setGame(res.game)
        setActiveIndex(0)
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

  const current = game?.items?.[activeIndex] ?? null

  async function playAudio() {
    if (!current) return
    try {
      setPlaying(true)
      const url = current.audioUrl
      if (url) {
        const audio = new Audio(url.startsWith('http://') ? url.replace(/^http:\/\//i, 'https://') : url)
        await audio.play()
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(current.word)
        utter.lang = 'de-DE'
        window.speechSynthesis.cancel()
        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utter)
      } else {
        throw new Error('No audio available')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to play audio')
    } finally {
      setPlaying(false)
    }
  }

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

      const res = await apiFetch<SubmitResponse>('/games/listening-practice/submit', {
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

  if (!game || !current) return null

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Listening Practice</div>
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
            <button
              type="button"
              onClick={playAudio}
              disabled={playing}
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/60 text-cyan-700 hover:bg-zinc-100 dark:bg-zinc-950/30 dark:text-cyan-200 dark:hover:bg-zinc-900/40"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <div className="text-xs font-semibold text-muted-foreground">Choose the word you hear</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {current.options.map((opt) => {
                const active = selections[current.index] === opt
                return (
                  <Button
                    key={opt}
                    variant={active ? 'primary' : 'outline'}
                    className="h-12"
                    onClick={() => {
                      if (result) return
                      setSelections((s) => ({ ...s, [current.index]: opt }))
                      setActiveIndex((i) => Math.min(game.items.length - 1, i + 1))
                    }}
                  >
                    {opt}
                  </Button>
                )
              })}
            </div>
          </Card>

          <div className="mt-6 flex items-center gap-3">
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
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="font-semibold">{result.message}</div>
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
