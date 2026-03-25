'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';
import { dispatchLevelUp } from '@/lib/gamificationEvents';
import type { LevelUpPayload } from '@/components/gamification/LevelUpModal';

type GameItem = {
  word: string;
  translation: string;
  options: string[];
  correct: string;
};

type GameData = {
  type: string;
  title: string;
  description: string;
  xpPerCorrect: number;
  items: GameItem[];
};

type GameResponse = {
  game: GameData;
};

type GameResult = {
  correctCount: number;
  total: number;
  xpEarned: number;
  message: string;
};

type GameSubmitResponse = {
  result: GameResult;
  levelUp?: LevelUpPayload;
};

type WordLookupResponse = {
  word: string;
  article?: string;
  translation?: string;
  phonetic?: string | null;
  audioUrl?: string | null;
  meanings?: Array<{ partOfSpeech: string | null; definitions: Array<{ definition: string | null; example: string | null }> }>;
  sourceUrls?: string[];
};

export default function FindArticleGame() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [speaking, setSpeaking] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const hasToken = Boolean(getToken());

  const total = gameData?.items?.length ?? 0;
  const answeredCount = useMemo(() => Object.keys(selections).length, [selections]);
  const currentItem = gameData?.items?.[activeIndex] ?? null;
  const progressPct = total > 0 ? Math.round(((activeIndex + 1) / total) * 100) : 0;

  async function ensureTtsVoicesLoaded() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing && existing.length > 0) return;

    await new Promise<void>((resolve) => {
      let done = false;
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        synth.removeEventListener('voiceschanged', onChanged);
        resolve();
      }, 800);

      function onChanged() {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        synth.removeEventListener('voiceschanged', onChanged);
        resolve();
      }

      synth.addEventListener('voiceschanged', onChanged);
      // Some browsers only populate voices after this call.
      synth.getVoices();
    });
  }

  async function speakCurrentWord() {
    const word = currentItem?.word;
    if (!word) return;

    try {
      setSpeaking(true);
      setError(null);

      const info = await apiFetch<WordLookupResponse>(`/games/word/${encodeURIComponent(word)}`);

      if (info.audioUrl) {
        const audioUrl = info.audioUrl.startsWith('http://')
          ? info.audioUrl.replace(/^http:\/\//i, 'https://')
          : info.audioUrl;
        try {
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          await audio.play();
          return;
        } catch {
          // Fall back to TTS below.
        }
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        await ensureTtsVoicesLoaded();
        const utter = new SpeechSynthesisUtterance(word);
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        const deVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('de'));
        if (deVoice) utter.voice = deVoice;
        utter.lang = deVoice?.lang ?? 'de-DE';
        synth.cancel();
        synth.resume();
        synth.speak(utter);
      } else {
        throw new Error('No pronunciation audio available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play pronunciation');
    } finally {
      setSpeaking(false);
    }
  }

  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<GameResponse>('/games/find-article?count=10');
        setGameData(res.game);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, []);

  async function submitGame() {
    if (!gameData) return;

    // Check if all items have been selected
    const totalItems = gameData.items.length;
    const selectedCount = Object.keys(selections).length;

    if (selectedCount < totalItems) {
      setError(`Please select an article for all ${totalItems} words. Currently answered: ${selectedCount}/${totalItems}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectionsArr = gameData.items.map((item, index) => ({
        index,
        answer: selections[index] || '',
        correct: item.correct // Include the correct answer for validation
      }));

      const res = await apiFetch<GameSubmitResponse>('/games/find-article/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: selectionsArr })
      });

      setResult(res.result);
      if (res.levelUp) dispatchLevelUp(res.levelUp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  function resetGame() {
    setSelections({});
    setResult(null);
    setError(null);
    setActiveIndex(0);
    // Reload game to get new words
    window.location.reload();
  }

  function pickAnswer(answer: string) {
    if (!gameData) return;
    if (result) return;

    setSelections((s) => ({ ...s, [activeIndex]: answer }));

    const next = activeIndex + 1;
    if (next < gameData.items.length) {
      setActiveIndex(next);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Loading game…</div>
      </AppShell>
    );
  }

  if (error && !gameData) {
    return (
      <AppShell>
        <div className="text-sm text-red-700">{error}</div>
      </AppShell>
    );
  }

  if (!gameData) return null;

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
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Finding the Article</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-64 max-w-[60vw] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="text-xs font-semibold text-muted-foreground">{Math.min(activeIndex + 1, total)}/{total || 0}</div>
          </div>
        </div>

        <Button variant="outline" asChild className="h-10 shrink-0">
          <Link href="/games">Back</Link>
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Card className="p-6">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <button
                type="button"
                onClick={speakCurrentWord}
                disabled={speaking}
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/60 text-cyan-700 hover:bg-zinc-100 dark:bg-zinc-950/30 dark:text-cyan-200 dark:hover:bg-zinc-900/40"
              >
                <Volume2 className="h-5 w-5" />
              </button>

              <div className="text-4xl font-extrabold tracking-tight text-foreground">{currentItem?.word ?? '—'}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plural: {currentItem?.word ?? '—'}</div>

              <div className="mt-5 rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-zinc-950/30">
                {currentItem?.translation ?? '—'}
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(currentItem?.options ?? ['der', 'die', 'das']).map((opt) => {
              const selected = selections[activeIndex];
              const active = selected === opt;
              return (
                <Button
                  key={opt}
                  type="button"
                  onClick={() => pickAnswer(opt)}
                  variant={active ? 'primary' : 'outline'}
                  className="h-14 text-base font-extrabold"
                >
                  {opt}
                </Button>
              );
            })}
          </div>

          <div className="mt-6 text-center text-[11px] font-semibold text-muted-foreground">USE KEYS 1 2 3 FOR QUICK SELECTION</div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              disabled={submitting || Boolean(result) || answeredCount < total}
              onClick={submitGame}
              className="h-10 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
            <Button variant="outline" type="button" onClick={resetGame} className="h-10">
              {result ? 'New Game' : 'Reset'}
            </Button>
            {!result ? (
              <div className="ml-auto text-sm text-muted-foreground">
                {answeredCount}/{total} answered
              </div>
            ) : null}
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
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Session Stats</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-3 text-xs dark:bg-zinc-950/30">
                <div className="text-muted-foreground">XP Earned</div>
                <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
                  +{result?.xpEarned ?? 0}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-3 text-xs dark:bg-zinc-950/30">
                <div className="text-muted-foreground">Current Streak</div>
                <div className="text-xs font-semibold text-foreground">0</div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-3 text-xs dark:bg-zinc-950/30">
                <div className="text-muted-foreground">Progress</div>
                <div className="text-xs font-semibold text-foreground">{Math.min(activeIndex + 1, total)}/{total || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-cyan-50/60 dark:bg-cyan-950/15 border border-cyan-100 dark:border-cyan-900">
            <div className="text-xs font-semibold text-muted-foreground">Tip</div>
            <div className="mt-2 text-xs text-muted-foreground">Most nouns ending in “-ung” are feminine (DIE).</div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-bold text-foreground">Game</div>
            <div className="mt-2 text-xs text-muted-foreground">{gameData.title}</div>
            <div className="mt-2 text-xs text-muted-foreground">{gameData.description}</div>
            <div className="mt-3 text-[11px] font-semibold text-muted-foreground">{gameData.xpPerCorrect} XP per correct</div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
