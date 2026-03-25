'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

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

export default function FindArticleGame() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasToken = Boolean(getToken());

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

      const res = await apiFetch<{ result: GameResult }>('/games/find-article/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: selectionsArr })
      });

      setResult(res.result);
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
    // Reload game to get new words
    window.location.reload();
  }

  if (loading) {
    return <Container size="lg" className="py-10 text-sm text-zinc-600">Loading game…</Container>;
  }

  if (error && !gameData) {
    return <Container size="lg" className="py-10 text-sm text-red-700">{error}</Container>;
  }

  if (!gameData) return null;

  if (!hasToken) {
    return (
      <Container size="lg" className="py-10">
        <h1 className="text-xl font-semibold">Login required</h1>
        <p className="mt-2 text-sm text-zinc-600">You need to login to play games and earn XP.</p>
        <Button asChild className="mt-6">
          <Link href="/login">Login</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{gameData.title}</h1>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>

      <p className="mt-2 text-sm text-zinc-600">{gameData.description}</p>
      <p className="mt-1 text-sm text-zinc-600">🏆 {gameData.xpPerCorrect} XP per correct answer</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-5">
          {gameData.items.map((item, idx) => {
            const selected = selections[idx];
            const options = item.options;

            return (
              <div key={idx} className="rounded-lg border border-zinc-200 p-4">
                <div className="text-lg font-bold text-center mb-2">{item.word}</div>
                <div className="text-sm text-zinc-600 text-center mb-4">({item.translation})</div>
                <div className="flex gap-3 justify-center">
                  {options.map((opt) => (
                    <Button
                      key={opt}
                      variant={selected === opt ? 'primary' : 'outline'}
                      type="button"
                      onClick={() => setSelections((s) => ({ ...s, [idx]: opt }))}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {result ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <div>Result: {result.correctCount}/{result.total} correct — XP earned: {result.xpEarned}</div>
            <div className="mt-2 font-semibold">{result.message}</div>
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button disabled={submitting} onClick={submitGame}>
            {submitting ? 'Submitting…' : 'Submit Answers'}
          </Button>
          <Button variant="outline" type="button" onClick={resetGame}>
            {result ? 'New Game' : 'Reset'}
          </Button>
          {!result && (
            <div className="ml-auto text-sm text-zinc-600">
              {Object.keys(selections).length}/{gameData.items.length} answered
            </div>
          )}
        </div>
      </Card>
    </Container>
  );
}
