'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, use } from 'react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';

type FindArticleItem = {
  noun: string;
  correct: 'der' | 'die' | 'das';
  distractors: Array<'der' | 'die' | 'das'>;
};

type AlphabetRecognitionItem = {
  letter: string;
  example: string;
  options: string[];
};

type CaseIdentificationItem = {
  sentence: string;
  case: string;
  options: string[];
};

type PrepositionCasesItem = {
  preposition: string;
  case: string;
  options: string[];
};

type Activity = {
  _id: string;
  type: 'find_article' | 'alphabet_recognition' | 'case_identification' | 'preposition_cases';
  prompt: string;
  payload: { items: FindArticleItem[] } | { items: AlphabetRecognitionItem[] } | { items: CaseIdentificationItem[] } | { items: PrepositionCasesItem[] };
  scoring?: { xpCorrect: number; xpIncorrect: number };
};

export default function ActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.activityId;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correctCount: number; total: number; xpEarned: number; lessonCompleted?: boolean } | null>(null);

  const hasToken = useMemo(() => Boolean(getToken()), []);

  useEffect(() => {
    async function load() {
      // Check if activityId exists and is valid
      if (!activityId || activityId === 'undefined') {
        setError('Invalid activity ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<{ activity: Activity }>(`/content/activities/${activityId}`);
        console.log('Activity response:', res); // Debug log
        console.log('Activity payload items:', res.activity?.payload?.items); // Debug log
        setActivity(res.activity);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [activityId]);

  async function submit() {
    if (!activity) return;
    
    // Check if all items have been selected
    const totalItems = activity.payload.items.length;
    const selectedCount = Object.keys(selections).length;
    
    if (selectedCount < totalItems) {
      setError(`Please select an answer for all ${totalItems} items. Currently answered: ${selectedCount}/${totalItems}`);
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      let selectionsArr: { index: number; answer: string }[];
      
      if (activity.type === 'alphabet_recognition') {
        selectionsArr = (activity.payload as { items: AlphabetRecognitionItem[] }).items.map((it, index) => ({
          index,
          answer: selections[index] || ''
        }));
      } else if (activity.type === 'case_identification') {
        selectionsArr = (activity.payload as { items: CaseIdentificationItem[] }).items.map((it, index) => ({
          index,
          answer: selections[index] || ''
        }));
      } else if (activity.type === 'preposition_cases') {
        selectionsArr = (activity.payload as { items: PrepositionCasesItem[] }).items.map((it, index) => ({
          index,
          answer: selections[index] || ''
        }));
      } else {
        // find_article
        selectionsArr = (activity.payload as { items: FindArticleItem[] }).items.map((it, index) => ({
          index,
          answer: selections[index] || 'der'
        }));
      }

      const res = await apiFetch<{ result: { correctCount: number; total: number; xpEarned: number } }>(
        `/content/activities/${activityId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections: selectionsArr })
        }
      );
      
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="text-sm text-red-700">{error}</div>
      </AppShell>
    )
  }

  if (!activity) return null;

  if (!hasToken) {
    return (
      <AppShell>
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">Login required</h1>
          <p className="mt-2 text-sm text-muted-foreground">You need to login to submit attempts and earn XP.</p>
          <Button asChild className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground">Practice Activity</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">
            {activity.type === 'alphabet_recognition'
              ? 'Alphabet Recognition'
              : activity.type === 'case_identification'
                ? 'Case Identification'
                : activity.type === 'preposition_cases'
                  ? 'Preposition Cases'
                  : 'Find the Article'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{activity.prompt}</p>
        </div>
        <Button variant="outline" asChild className="h-10">
          <Link href="/activities">Back</Link>
        </Button>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-5">
          {activity.type === 'alphabet_recognition' ? (
            // Alphabet Recognition Activity
            (activity.payload as { items: AlphabetRecognitionItem[] }).items.map((it, idx) => {
              console.log('Rendering alphabet item:', it); // Debug log
              const selected = selections[idx];
              const options = it.options;

              return (
                <div key={idx} className="rounded-2xl border border-border bg-white/60 p-4 dark:bg-zinc-950/30">
                  <div className="text-lg font-extrabold text-center mb-2 text-foreground">{it.letter}</div>
                  <div className="text-sm text-muted-foreground text-center mb-4">like in {it.example}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((opt: string) => (
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
            })
          ) : activity.type === 'case_identification' ? (
            // Case Identification Activity
            (activity.payload as { items: CaseIdentificationItem[] }).items.map((it, idx) => {
              console.log('Rendering case identification item:', it); // Debug log
              const selected = selections[idx];
              const options = it.options;

              return (
                <div key={idx} className="rounded-2xl border border-border bg-white/60 p-4 dark:bg-zinc-950/30">
                  <div className="text-sm mb-3 text-muted-foreground" dangerouslySetInnerHTML={{ 
                    __html: it.sentence.replace(/___([^_]+)___/g, '<span class="font-bold text-blue-600">$1</span>') 
                  }}></div>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((opt: string) => (
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
            })
          ) : activity.type === 'preposition_cases' ? (
            // Preposition Cases Activity
            (activity.payload as { items: PrepositionCasesItem[] }).items.map((it, idx) => {
              console.log('Rendering preposition cases item:', it); // Debug log
              const selected = selections[idx];
              const options = it.options;

              return (
                <div key={idx} className="rounded-2xl border border-border bg-white/60 p-4 dark:bg-zinc-950/30">
                  <div className="text-lg font-extrabold text-center mb-2 text-foreground">{it.preposition}</div>
                  <div className="text-sm text-muted-foreground text-center mb-4">Choose the correct case</div>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((opt: string) => (
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
            })
          ) : (
            // Find Article Activity
            (activity.payload as { items: FindArticleItem[] }).items.map((it, idx) => {
              console.log('Rendering find article item:', it); // Debug log
              const options = (['der', 'die', 'das'] as const);
              const selected = selections[idx] as 'der' | 'die' | 'das';

              return (
                <div key={idx} className="rounded-2xl border border-border bg-white/60 p-4 dark:bg-zinc-950/30">
                  <div className="text-sm font-bold text-foreground">{it.noun}</div>
                  <div className="mt-3 flex gap-3">
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
            })
          )}
        </div>

        {result ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <div>Result: {result.correctCount}/{result.total} correct — XP earned: {result.xpEarned}</div>
            {result.lessonCompleted && (
              <div className="mt-2 font-semibold">
                🎉 Lesson completed! Next lesson unlocked.
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button disabled={submitting} onClick={submit}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setSelections({});
              setResult(null);
              setError(null);
            }}
          >
            Reset
          </Button>
          {result?.lessonCompleted && (
            <Button
              asChild
              className="ml-auto bg-green-600 hover:bg-green-700"
            >
              <Link href="/dashboard">
                Next Lesson →
              </Link>
            </Button>
          )}
          {!result?.lessonCompleted && (
            <>
              {activity.type === 'alphabet_recognition' && (
                <div className="ml-auto text-sm text-muted-foreground">
                  {Object.keys(selections).length}/{(activity.payload as { items: AlphabetRecognitionItem[] }).items.length} answered
                </div>
              )}
              {activity.type === 'case_identification' && (
                <div className="ml-auto text-sm text-muted-foreground">
                  {Object.keys(selections).length}/{(activity.payload as { items: CaseIdentificationItem[] }).items.length} answered
                </div>
              )}
              {activity.type === 'preposition_cases' && (
                <div className="ml-auto text-sm text-muted-foreground">
                  {Object.keys(selections).length}/{(activity.payload as { items: PrepositionCasesItem[] }).items.length} answered
                </div>
              )}
              {activity.type === 'find_article' && (
                <div className="ml-auto text-sm text-muted-foreground">
                  {Object.keys(selections).length}/{(activity.payload as { items: FindArticleItem[] }).items.length} answered
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
