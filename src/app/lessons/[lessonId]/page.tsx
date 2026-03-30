'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';

type LessonBlock =
  | { type: 'text'; text: string }
  | { type: 'example'; de: string; en?: string }
  | { type: 'tip'; text: string };

type LessonVocab = {
  id?: string;
  lemma?: string;
  surface?: string;
  article?: string;
  gender?: string;
  pos?: string;
  translation?: string;
  translation_en?: string;
  en?: string;
  examples?: Array<{ de?: string; en?: string }>;
};

type LessonGrammarRule = {
  id?: string;
  title?: string;
  explanation?: string;
  examples?: Array<{ de?: string; en?: string }>;
};

type LessonExample = { de?: string; en?: string };

type LessonExercise = {
  id?: string;
  type?: string;
  prompt?: string;
  question?: string;
  sentence?: string;
  answer?: string;
  choices?: string[];
  correctIndex?: number;
  answer_index?: number;
  pairs?: Array<{ left: string; right: string }>;
  words?: string[];
  target?: string;
  items?: Array<Record<string, unknown>>;
};

type Lesson = {
  _id: string;
  title: string;
  objectives: string[];
  contentBlocks: LessonBlock[];
  moduleId?: string;
  vocabulary?: LessonVocab[];
  grammarRules?: LessonGrammarRule[];
  examples?: LessonExample[];
  exercises?: LessonExercise[];
  xp?: number;
  estimatedDurationMin?: number;
  difficulty?: string;
};

type Activity = { _id: string; type: string; prompt: string; order: number };

type LessonResponse = { lesson: Lesson; activities: Activity[] };

type ModuleLesson = {
  _id: string;
  title: string;
  order: number;
};

type ModuleLessonsResponse = {
  lessons: Array<ModuleLesson & { status?: string; isCurrent?: boolean }>;
};

type WordLookupResponse = {
  word: string;
  phonetic?: string | null;
  audioUrl?: string | null;
};

function normalizeParam(value: string | string[] | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toSentenceCount(text: string) {
  const cleaned = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .join(' ')
    .trim();
  if (!cleaned) return 0;
  const parts = cleaned.split(/[.!?]+/).map((p) => p.trim()).filter(Boolean);
  return parts.length;
}

function vocabDe(v: LessonVocab) {
  const surface = (v.surface ?? '').trim();
  if (surface) return surface;
  const combined = `${v.article ?? ''} ${v.lemma ?? ''}`.trim();
  return combined || (v.lemma ?? '—');
}

function vocabEn(v: LessonVocab) {
  const t = (v.translation_en ?? v.translation ?? v.en ?? '').trim();
  return t || '—';
}

export default function LessonPage({ params }: { params: { lessonId?: string } }) {
  const routeParams = useParams<{ lessonId?: string | string[] }>();
  const lessonId = normalizeParam(routeParams?.lessonId) ?? (params?.lessonId ?? null);

  const searchParams = useSearchParams();
  const backHref = useMemo(() => {
    const moduleId = searchParams.get('moduleId');
    return moduleId ? `/modules/${moduleId}` : '/modules';
  }, [searchParams]);
  
  const [data, setData] = useState<LessonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [moduleLessons, setModuleLessons] = useState<ModuleLessonsResponse | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState<string | null>(null);

  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const [query, setQuery] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'vocab' | 'grammar' | 'exercises'>('overview');
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [mcqChoice, setMcqChoice] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [speakingDraft, setSpeakingDraft] = useState('');

  const examples = useMemo(() => {
    const lessonExamples = data?.lesson?.examples ?? [];
    const fromBlocks = (data?.lesson?.contentBlocks ?? []).filter(
      (b): b is Extract<LessonBlock, { type: 'example' }> => b.type === 'example'
    );
    const normalizedFromLesson = lessonExamples
      .filter(Boolean)
      .map((ex) => ({ type: 'example' as const, de: ex.de ?? '', en: ex.en }));
    return [...normalizedFromLesson, ...fromBlocks].filter((ex) => (ex.de ?? '').trim().length > 0);
  }, [data]);

  const conjugationRows = useMemo(() => {
    const tips = (data?.lesson?.contentBlocks ?? [])
      .filter((b): b is Extract<LessonBlock, { type: 'tip' }> => b.type === 'tip')
      .map((b) => b.text)
      .filter(Boolean);

    const text = tips.join('\n');
    if (!text.trim()) return [] as Array<{ person: string; formA: string; formB: string }>;

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const rows: Array<{ person: string; formA: string; formB: string }> = [];
    for (const line of lines) {
      const m = line.match(/^(ich|du|er\/sie\/es|wir|ihr|sie\/Sie)\s*[:\-–—]\s*(.+)$/i);
      if (!m) continue;
      const person = m[1];
      const rest = m[2];
      const parts = rest.split(/\s*\|\s*|\s*\/\s*/);
      rows.push({
        person,
        formA: (parts[0] ?? '').trim() || '—',
        formB: (parts[1] ?? '').trim() || '—',
      });
    }
    return rows;
  }, [data]);

  const firstActivityHref = useMemo(() => {
    const a = data?.activities?.[0];
    return a?._id ? `/activities/${a._id}` : null;
  }, [data]);

  const lessonVocab = useMemo(() => data?.lesson?.vocabulary ?? [], [data]);
  const lessonGrammar = useMemo(() => data?.lesson?.grammarRules ?? [], [data]);
  const lessonExercises = useMemo(() => data?.lesson?.exercises ?? [], [data]);

  const filteredVocab = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessonVocab;
    return lessonVocab.filter((v) => {
      const de = `${v.article ?? ''} ${v.lemma ?? ''}`.toLowerCase();
      const en = `${v.translation ?? v.en ?? ''}`.toLowerCase();
      return de.includes(q) || en.includes(q);
    });
  }, [lessonVocab, query]);

  const filteredGrammar = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessonGrammar;
    return lessonGrammar.filter((g) => {
      const title = (g.title ?? '').toLowerCase();
      const exp = (g.explanation ?? '').toLowerCase();
      return title.includes(q) || exp.includes(q);
    });
  }, [lessonGrammar, query]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessonExercises;
    return lessonExercises.filter((e) => {
      const t = (e.type ?? '').toLowerCase();
      const p = (e.prompt ?? e.question ?? e.sentence ?? '').toLowerCase();
      return t.includes(q) || p.includes(q);
    });
  }, [lessonExercises, query]);

  const prevNext = useMemo(() => {
    const lessons = moduleLessons?.lessons ?? [];
    const idx = lessons.findIndex((l) => l._id === lessonId);
    const prev = idx > 0 ? lessons[idx - 1] : null;
    const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
    return {
      prevHref: prev ? `/lessons/${prev._id}${searchParams.get('moduleId') ? `?moduleId=${searchParams.get('moduleId')}` : ''}` : null,
      nextHref: next ? `/lessons/${next._id}${searchParams.get('moduleId') ? `?moduleId=${searchParams.get('moduleId')}` : ''}` : null,
    };
  }, [lessonId, moduleLessons, searchParams]);

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
      synth.getVoices();
    });
  }

  async function speakGerman(text: string) {
    if (!text) return;

    const trimmed = text.trim();
    const speakText = trimmed.split('(')[0]?.trim() || trimmed;
    setCompleteError(null);

    try {
      setSpeakingKey(speakText);

      // Only try dictionary audio for single-word items (more reliable).
      const isSingleWord = /^\p{L}+[\p{L}\p{M}'-]*$/u.test(speakText);
      if (isSingleWord) {
        try {
          const info = await apiFetch<WordLookupResponse>(`/games/word/${encodeURIComponent(speakText)}`);
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
              // Fall back to TTS.
            }
          }
        } catch {
          // Fall back to TTS.
        }
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        await ensureTtsVoicesLoaded();
        const utter = new SpeechSynthesisUtterance(speakText);
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        const deVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('de'));
        if (deVoice) utter.voice = deVoice;
        utter.lang = deVoice?.lang ?? 'de-DE';
        synth.cancel();
        synth.resume();
        synth.speak(utter);
      } else {
        throw new Error('No audio and no TTS available');
      }
    } finally {
      setSpeakingKey(null);
    }
  }

  async function completeLesson() {
    try {
      setCompleting(true);
      setCompleteError(null);
      setCompleteSuccess(null);
      await apiFetch(`/content/lessons/${lessonId}/complete`, { method: 'POST' });
      setCompleteSuccess('Lesson completed. Next content unlocked.');
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Failed to complete lesson');
    } finally {
      setCompleting(false);
    }
  }

  useEffect(() => {
    async function load() {
      // Check if lessonId exists and is valid
      if (!lessonId || lessonId === 'undefined') {
        setError('Invalid lesson ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<LessonResponse>(`/content/lessons/${lessonId}`);
        setData(res);

        const moduleId = res.lesson?.moduleId;
        if (moduleId) {
          const lessonsRes = await apiFetch<ModuleLessonsResponse>(`/content/modules/${moduleId}/lessons`);
          setModuleLessons(lessonsRes);
        } else {
          setModuleLessons(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId]);

  useEffect(() => {
    setExerciseIdx(0);
    setMcqChoice(null);
    setTypedAnswer('');
    setSpeakingDraft('');
  }, [data?.lesson?._id, activeTab]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="text-sm text-red-700">{error}</div>
      </AppShell>
    );
  }

  if (!data) return null;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-muted-foreground">
            <span className="text-muted-foreground">Learning Path</span>
            <span className="mx-2">›</span>
            <span className="text-muted-foreground">Lesson</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-foreground)]">A2 Elementary</div>
            <div className="rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-semibold text-[var(--primary-foreground)]">+{data.lesson.xp ?? 10} XP</div>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-foreground">{data.lesson.title}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {data.lesson.objectives?.[0] ?? 'In this lesson, you will learn key grammar and vocabulary through guided examples.'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-xs text-muted-foreground md:flex">
            <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            <div>{data.lesson.estimatedDurationMin ?? 15} min</div>
          </div>
          <Button variant="outline" asChild className="h-10">
            <Link href={backHref}>Back</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-4xl">
        {completeError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{completeError}</div>
        ) : null}
        {completeSuccess ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{completeSuccess}</div>
        ) : null}

        <div className="relative">
          <input
            placeholder="Search lessons, grammar, vocab…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-[var(--card)] px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`h-10 rounded-xl border border-border text-sm font-semibold ${
              activeTab === 'overview' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--card)] text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`h-10 rounded-xl border border-border text-sm font-semibold ${
              activeTab === 'vocab' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--card)] text-foreground'
            }`}
          >
            Vocabulary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`h-10 rounded-xl border border-border text-sm font-semibold ${
              activeTab === 'grammar' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--card)] text-foreground'
            }`}
          >
            Grammar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exercises')}
            className={`h-10 rounded-xl border border-border text-sm font-semibold ${
              activeTab === 'exercises' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--card)] text-foreground'
            }`}
          >
            Exercises
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {activeTab === 'overview' ? (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Usage and Context</div>
                  <div className="text-xs text-muted-foreground">
                    {data.lesson.difficulty ? `Difficulty: ${data.lesson.difficulty}` : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {(examples.length ? examples.slice(0, 2) : data.lesson.contentBlocks?.filter((b) => b.type !== 'tip').slice(0, 2) ?? []).map((b, idx) => {
                    if (b.type === 'example') {
                      return (
                        <div key={idx} className="rounded-2xl border border-border bg-[var(--card)] p-4">
                          <div className="text-xs font-semibold text-muted-foreground">Example</div>
                          <div className="mt-2 text-sm font-semibold text-foreground">{b.de}</div>
                          {b.en ? <div className="mt-1 text-xs text-muted-foreground">{b.en}</div> : null}
                        </div>
                      )
                    }
                    if (b.type === 'text') {
                      return (
                        <div key={idx} className="rounded-2xl border border-border bg-[var(--card)] p-4 text-sm text-muted-foreground">
                          {b.text}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </Card>

              {(data.lesson.contentBlocks?.some((b) => b.type === 'tip') ?? false) && (
                <Card className="p-6 bg-[var(--card)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-foreground">Grammar Rule</div>
                    <div className="rounded-full border border-border bg-[var(--card)] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">A2 Rules</div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {data.lesson.contentBlocks
                      .filter((b): b is Extract<LessonBlock, { type: 'tip' }> => b.type === 'tip')
                      .slice(0, 1)
                      .map((b, idx) => (
                        <div key={idx} className="text-sm leading-7 text-muted-foreground">
                          {b.text}
                        </div>
                      ))}
                  </div>
                  {conjugationRows.length ? (
                    <div className="mt-5 rounded-2xl border border-border bg-[var(--card)] p-4">
                      <div className="text-xs font-semibold text-muted-foreground">Conjugation Chart</div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="font-semibold text-muted-foreground">Person</div>
                        <div className="font-semibold text-muted-foreground">Form A</div>
                        <div className="font-semibold text-muted-foreground">Form B</div>
                        {conjugationRows.slice(0, 6).map((row) => (
                          <div key={row.person} className="contents">
                            <div className="text-muted-foreground">{row.person}</div>
                            <div className="text-foreground">{row.formA}</div>
                            <div className="text-foreground">{row.formB}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Key Vocabulary (Preview)</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vocab')}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-[var(--card)]">
                  <div className="grid grid-cols-[1fr_1fr_56px] gap-0 border-b border-border px-4 py-3 text-[11px] font-semibold text-muted-foreground">
                    <div>Deutsch</div>
                    <div>English</div>
                    <div className="text-right"> </div>
                  </div>
                  {(lessonVocab ?? []).slice(0, 6).map((v, idx) => {
                    const de = vocabDe(v);
                    const en = vocabEn(v);
                    return (
                      <div key={v.id ?? idx} className="grid grid-cols-[1fr_1fr_56px] gap-0 px-4 py-3 text-sm">
                        <div className="text-foreground">{de}</div>
                        <div className="text-muted-foreground">{en}</div>
                        <button
                          type="button"
                          onClick={() => speakGerman(de)}
                          disabled={speakingKey === de.trim().split('(')[0]?.trim()}
                          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-50"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  {!lessonVocab?.length ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">No vocabulary items available for this lesson.</div>
                  ) : null}
                </div>
              </Card>
            </>
          ) : null}

          {activeTab === 'vocab' ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-foreground">Key Vocabulary</div>
                <div className="text-xs text-muted-foreground">Tap speaker to listen</div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-[var(--card)]">
                <div className="grid grid-cols-[1fr_1fr_56px] gap-0 border-b border-border px-4 py-3 text-[11px] font-semibold text-muted-foreground">
                  <div>Deutsch</div>
                  <div>English</div>
                  <div className="text-right"> </div>
                </div>
                {filteredVocab.slice(0, 60).map((v, idx) => {
                  const de = vocabDe(v);
                  const en = vocabEn(v);
                  return (
                    <div key={v.id ?? idx} className="grid grid-cols-[1fr_1fr_56px] gap-0 px-4 py-3 text-sm">
                      <div className="text-foreground">{de}</div>
                      <div className="text-muted-foreground">{en}</div>
                      <button
                        type="button"
                        onClick={() => speakGerman(de)}
                        disabled={speakingKey === de.trim().split('(')[0]?.trim()}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-50"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {!filteredVocab.length ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No vocabulary items available for this lesson.</div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'grammar' ? (
            <Card className="p-6 bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-foreground">Grammar</div>
                <div className="text-xs text-muted-foreground">Rules & examples</div>
              </div>

              <div className="mt-4 space-y-4">
                {filteredGrammar.slice(0, 20).map((g, idx) => (
                  <div key={g.id ?? idx} className="rounded-2xl border border-border bg-[var(--card)] p-4">
                    <div className="text-sm font-bold text-foreground">{g.title ?? `Rule ${idx + 1}`}</div>
                    {g.explanation ? <div className="mt-2 text-sm leading-7 text-muted-foreground">{g.explanation}</div> : null}
                    {g.examples?.length ? (
                      <div className="mt-3 space-y-2">
                        {g.examples.slice(0, 3).map((ex, exIdx) => (
                          <div key={exIdx} className="rounded-xl border border-border bg-[var(--card)] px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-foreground">{ex.de ?? '—'}</div>
                                {ex.en ? <div className="mt-1 text-xs text-muted-foreground">{ex.en}</div> : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => speakGerman(ex.de ?? '')}
                                disabled={!ex.de}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-50"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {!filteredGrammar.length ? (
                  <div className="text-sm text-muted-foreground">No grammar rules available for this lesson.</div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'exercises' ? (
            <Card className="p-6 bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-foreground">Exercises</div>
                <div className="text-xs text-muted-foreground">Practice in-page</div>
              </div>

              {!filteredExercises.length ? (
                <div className="mt-4 text-sm text-muted-foreground">
                  No exercises found for this lesson yet.
                </div>
              ) : (
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Exercise {exerciseIdx + 1} / {filteredExercises.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-9"
                        disabled={exerciseIdx === 0}
                        onClick={() => setExerciseIdx((i) => Math.max(0, i - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9"
                        disabled={exerciseIdx >= filteredExercises.length - 1}
                        onClick={() => setExerciseIdx((i) => Math.min(filteredExercises.length - 1, i + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  {(() => {
                    const ex = filteredExercises[exerciseIdx];
                    const type = ex.type ?? 'exercise';
                    const prompt = ex.prompt ?? ex.question ?? ex.sentence ?? 'Complete the exercise';

                    const firstItem = (ex.items?.[0] ?? {}) as Record<string, unknown>;

                    if (type === 'mcq') {
                      const question = (firstItem.question as string | undefined) ?? ex.question ?? '';
                      const choices = (firstItem.choices as string[] | undefined) ?? ex.choices ?? [];
                      const correctRaw =
                        (typeof firstItem.answer_index === 'number' ? firstItem.answer_index : undefined) ??
                        (typeof ex.answer_index === 'number' ? ex.answer_index : undefined) ??
                        (typeof ex.correctIndex === 'number' ? ex.correctIndex : undefined);
                      const correct = typeof correctRaw === 'number' ? correctRaw : null;
                      const chosen = mcqChoice;
                      const showResult = chosen !== null && correct !== null;
                      return (
                        <div className="rounded-2xl border border-border bg-[var(--card)] p-4">
                          <div className="text-xs font-semibold text-muted-foreground">Multiple choice</div>
                          <div className="mt-2 text-sm font-bold text-foreground">{prompt}</div>
                          {question ? <div className="mt-1 text-sm text-muted-foreground">{question}</div> : null}
                          <div className="mt-4 grid gap-2">
                            {choices.map((c, idx) => {
                              const selected = chosen === idx;
                              const correctPick = showResult && idx === correct;
                              const wrongPick = showResult && selected && idx !== correct;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setMcqChoice(idx)}
                                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                                    correctPick
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : wrongPick
                                        ? 'border-red-200 bg-red-50 text-red-800'
                                        : selected
                                          ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                                          : 'border-border bg-[var(--card)] text-foreground hover:bg-[var(--accent)]'
                                  }`}
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                          {showResult ? (
                            <div className="mt-4 text-sm font-semibold">
                              {chosen === correct ? (
                                <div className="text-emerald-700">Correct</div>
                              ) : (
                                <div className="text-red-700">Try again</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    if (type === 'gap_fill' || type === 'typing') {
                      const sentence = (firstItem.text as string | undefined) ?? ex.sentence ?? '';
                      const answer = ((firstItem.answer as string | undefined) ?? ex.answer ?? ex.target ?? '').trim();
                      const target = ((firstItem.target as string | undefined) ?? ex.target ?? '').trim();
                      const effectiveAnswer = (type === 'typing' ? target : answer).trim();
                      return (
                        <div className="rounded-2xl border border-border bg-[var(--card)] p-4">
                          <div className="text-xs font-semibold text-muted-foreground">{type === 'gap_fill' ? 'Fill the gap' : 'Typing'}</div>
                          <div className="mt-2 text-sm font-bold text-foreground">{prompt}</div>
                          {type === 'gap_fill' && sentence ? (
                            <div className="mt-2 text-sm text-muted-foreground">{sentence}</div>
                          ) : null}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              value={typedAnswer}
                              onChange={(e) => setTypedAnswer(e.target.value)}
                              className="h-10 w-full rounded-xl border border-border bg-[var(--card)] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                              placeholder="Type your answer"
                            />
                            <Button
                              variant="outline"
                              className="h-10"
                              onClick={() => {
                                if (!effectiveAnswer) return;
                                setTypedAnswer(effectiveAnswer);
                              }}
                              disabled={!effectiveAnswer}
                            >
                              Show
                            </Button>
                          </div>
                          {effectiveAnswer ? (
                            <div className="mt-3 text-xs font-semibold">
                              {typedAnswer.trim().length ? (
                                typedAnswer.trim().toLowerCase() === effectiveAnswer.toLowerCase() ? (
                                  <span className="text-emerald-700">Correct</span>
                                ) : (
                                  <span className="text-red-700">Not yet</span>
                                )
                              ) : (
                                <span className="text-muted-foreground">Type an answer to check</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    if (type === 'speaking_prompt') {
                      const mustUse = (firstItem.must_use as string[] | undefined) ?? [];
                      const minSentences = (firstItem.min_sentences as number | undefined) ?? 5;
                      const count = toSentenceCount(speakingDraft);
                      const meets = count >= minSentences;
                      return (
                        <div className="rounded-2xl border border-border bg-[var(--card)] p-4">
                          <div className="text-xs font-semibold text-muted-foreground">Speaking / Writing</div>
                          <div className="mt-2 text-sm font-bold text-foreground">{prompt}</div>

                          {mustUse.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {mustUse.slice(0, 8).map((t) => (
                                <div
                                  key={t}
                                  className="rounded-full border border-border bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-muted-foreground"
                                >
                                  {t}
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <textarea
                            value={speakingDraft}
                            onChange={(e) => setSpeakingDraft(e.target.value)}
                            rows={5}
                            className="mt-4 w-full rounded-2xl border border-border bg-[var(--card)] p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            placeholder="Write your sentences here (recording can be added later)"
                          />

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs font-semibold text-muted-foreground">
                              {count} / {minSentences} sentences
                            </div>
                            <div className={`text-xs font-semibold ${meets ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                              {meets ? 'Ready' : 'Keep going'}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-2xl border border-border bg-[var(--card)] p-4">
                        <div className="text-xs font-semibold text-muted-foreground">{type}</div>
                        <div className="mt-2 text-sm font-bold text-foreground">{prompt}</div>
                        <div className="mt-3 text-sm text-muted-foreground">This exercise type is not yet supported in-page.</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          ) : null}

          <Card className="p-6 bg-[var(--card)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Ready to test your knowledge?</div>
                <div className="mt-1 text-xs text-muted-foreground">Complete the first exercise to reinforce the lesson and earn bonus XP.</div>
              </div>
              {firstActivityHref ? (
                <Button asChild className="h-10">
                  <Link href={firstActivityHref}>Start Exercise</Link>
                </Button>
              ) : (
                <Button className="h-10" onClick={() => setActiveTab('exercises')}>
                  Open Exercises
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          {prevNext.prevHref ? (
            <Button variant="outline" className="h-10" asChild>
              <Link href={prevNext.prevHref}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="h-10" disabled>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}

          <Button
            className="h-11 rounded-full px-8"
            onClick={completeLesson}
            disabled={completing}
          >
            {completing ? 'Completing…' : 'Mark Lesson Complete'}
          </Button>

          {prevNext.nextHref ? (
            <Button variant="outline" className="h-10" asChild>
              <Link href={prevNext.nextHref}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="h-10" disabled>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
