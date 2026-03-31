'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Search, Bookmark, BookmarkCheck, CheckCircle2, Circle, PanelLeft, X } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = { [key: string]: JsonValue }

type GlossaryEntry = { de: string; en: string }
type GrammarExample = { de: string; en: string; audioText?: string; glossary?: GlossaryEntry[] }

function speakGerman(text: string) {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return

  synth.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'de-DE'

  const voices = synth.getVoices?.() ?? []
  const deVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('de'))
  if (deVoice) utter.voice = deVoice

  synth.speak(utter)
}

type TopicType =
  | 'Verbs'
  | 'Nouns & Articles'
  | 'Cases'
  | 'Tenses'
  | 'Sentence Structure'
  | 'Pronouns'
  | 'Prepositions'
  | 'Adjectives'
  | 'Other'

function guessTopicType(item: GrammarLibraryItem): TopicType {
  const hay = `${item.title} ${(item.keywords ?? []).join(' ')}`.toLowerCase()
  if (/(verb|modal|trennbar|separable|konjug)/.test(hay)) return 'Verbs'
  if (/(artikel|nomen|noun|plural|genitiv|artikelw|der die das)/.test(hay)) return 'Nouns & Articles'
  if (/(akk|dat|genitiv|case|fälle)/.test(hay)) return 'Cases'
  if (/(perfekt|präteritum|plusquamperfekt|future|futur|tense)/.test(hay)) return 'Tenses'
  if (/(word order|satz|nebensatz|relativ|connector|weil|dass|wenn|konjunktiv|passiv)/.test(hay)) return 'Sentence Structure'
  if (/(pronoun|pronomen|reflexiv|relative pronouns)/.test(hay)) return 'Pronouns'
  if (/(präposition|preposition|wechselpräposition)/.test(hay)) return 'Prepositions'
  if (/(adjektiv|adjective)/.test(hay)) return 'Adjectives'
  return 'Other'
}

type ExplanationSectionKey =
  | 'What is it?'
  | 'Structure'
  | 'How it works'
  | 'Placement'
  | 'Examples'
  | 'Common mistakes'
  | 'Practice'
  | 'Other'

type ExplanationSection = {
  key: ExplanationSectionKey
  title: string
  body: string
}

function normalizeHeading(raw: string): ExplanationSectionKey {
  const h = raw.trim().toLowerCase()
  if (h === 'what is it?' || h === 'what is it') return 'What is it?'
  if (h === 'structure') return 'Structure'
  if (h === 'how it works' || h === 'how it work') return 'How it works'
  if (h === 'placement') return 'Placement'
  if (h === 'examples') return 'Examples'
  if (h === 'common mistakes' || h === 'common errors') return 'Common mistakes'
  if (h === 'practice') return 'Practice'
  return 'Other'
}

function parseStructuredExplanation(explanation: string): ExplanationSection[] {
  const src = (explanation ?? '').trim()
  if (!src) return []

  const lines = src.split(/\r?\n/)
  const out: ExplanationSection[] = []

  let curTitle: string | null = null
  let curBody: string[] = []

  function flush() {
    if (!curTitle) return
    const body = curBody.join('\n').trim()
    out.push({
      key: normalizeHeading(curTitle),
      title: curTitle.replace(/^#+\s*/, '').trim(),
      body,
    })
  }

  for (const line of lines) {
    const m = /^#\s+(.+)$/.exec(line.trim())
    if (m) {
      flush()
      curTitle = m[1]
      curBody = []
      continue
    }
    curBody.push(line)
  }
  flush()

  if (!out.length) {
    return [{ key: 'Other', title: 'Explanation', body: src }]
  }

  return out
}

function percent(n: number, d: number) {
  if (!d) return 0
  return Math.max(0, Math.min(100, Math.round((n / d) * 100)))
}

function levelLabel(levelKey: LibraryLevelKey) {
  return levelKey.toUpperCase()
}

type LibraryLevelKey = 'a0' | 'a1' | 'a2' | 'b1' | 'b2'

type FlatTopic = {
  levelKey: LibraryLevelKey
  levelLabel: string
  sectionTitle: string
  item: GrammarLibraryItem
  topicType: TopicType
  searchText: string
}

function storageGetJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function storageSetJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${v}%` }} />
    </div>
  )
}

function Pill({ children, tone }: { children: ReactNode; tone: 'level' | 'type' | 'error' }) {
  if (tone === 'error') return <Badge variant="destructive">{children}</Badge>
  if (tone === 'type') return <Badge variant="secondary">{children}</Badge>
  return <Badge>{children}</Badge>
}

function TopicViewer({
  topic,
  showTranslations,
  onToggleTranslations,
  isCompleted,
  onToggleCompleted,
  isBookmarked,
  onToggleBookmarked,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  topic: FlatTopic
  showTranslations: boolean
  onToggleTranslations: () => void
  isCompleted: boolean
  onToggleCompleted: () => void
  isBookmarked: boolean
  onToggleBookmarked: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({
    'What is it?': true,
    Structure: true,
    'How it works': true,
    Placement: true,
    Examples: true,
    'Common mistakes': true,
    Practice: true,
  })

  const structured = useMemo(() => parseStructuredExplanation(topic.item.explanation), [topic.item.explanation])
  const sectionsByKey = useMemo(() => {
    const map = new Map<ExplanationSectionKey, ExplanationSection[]>()
    for (const s of structured) {
      const arr = map.get(s.key) ?? []
      arr.push(s)
      map.set(s.key, arr)
    }
    return map
  }, [structured])

  const displayOrder: ExplanationSectionKey[] = ['What is it?', 'Structure', 'How it works', 'Placement', 'Examples', 'Common mistakes', 'Practice', 'Other']

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="level">{topic.levelLabel}</Pill>
              <Pill tone="type">{topic.topicType}</Pill>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-foreground break-words">{topic.item.title}</h2>
            <div className="mt-1 text-sm text-muted-foreground break-words">
              {topic.sectionTitle}
              <span className="mx-2">/</span>
              Self-learning view
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={onToggleTranslations}>
              {showTranslations ? 'Hide translations' : 'Show translations'}
            </Button>

            <Button type="button" variant="outline" onClick={onToggleBookmarked}>
              {isBookmarked ? (
                <span className="inline-flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4" /> Bookmarked
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Bookmark className="h-4 w-4" /> Bookmark
                </span>
              )}
            </Button>

            <Button type="button" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={onToggleCompleted}>
              {isCompleted ? 'Mark as not completed' : 'Mark as completed'}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" disabled={!hasPrev} onClick={onPrev}>
            Previous
          </Button>
          <Button type="button" variant="outline" disabled={!hasNext} onClick={onNext}>
            Next
          </Button>
        </div>
      </Card>

      {displayOrder
        .flatMap((k) => sectionsByKey.get(k) ?? [])
        .map((sec, idx) => {
          const key = `${sec.key}:${sec.title}:${idx}`
          const open = openKeys[sec.title] ?? true
          const isErrors = sec.key === 'Common mistakes'
          return (
            <Card key={key} className="p-5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4"
                onClick={() => setOpenKeys((m) => ({ ...m, [sec.title]: !(m[sec.title] ?? true) }))}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{sec.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Click to {open ? 'collapse' : 'expand'}</div>
                </div>
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>

              {open ? (
                <div className="mt-4 space-y-4">
                  <div className="text-sm text-foreground whitespace-pre-wrap">{sec.body}</div>

                  {sec.key === 'Examples' && topic.item.examples?.length ? (
                    <div className="space-y-2">
                      {topic.item.examples.map((ex, eIdx) => (
                        <div key={eIdx} className="rounded-xl border border-[var(--accent)] bg-[var(--accent)] p-3 text-sm text-foreground dark:bg-[var(--accent)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">{ex.de}</div>
                              {showTranslations ? <div className="mt-1 text-xs text-muted-foreground">{ex.en}</div> : null}
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => speakGerman(ex.audioText || ex.de)}
                            >
                              Listen
                            </Button>
                          </div>

                          {ex.glossary?.length ? (
                            <div className="mt-3">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Word meanings</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ex.glossary.map((g, gIdx) => (
                                  <span
                                    key={`${g.de}-${gIdx}`}
                                    className="rounded-full border border-border bg-[var(--accent)] px-2 py-1 text-[11px] text-muted-foreground dark:bg-[var(--accent)] "
                                  >
                                    <span className="font-semibold text-foreground">{g.de}</span> — {g.en}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {sec.key === 'Practice' && topic.item.practice?.length ? (
                    <div className="space-y-2">
                      {topic.item.practice.map((p, pIdx) => (
                        <div key={pIdx} className="rounded-xl border border-border bg-white/90 p-3 text-sm text-foreground dark:bg-[var(--background)] ">
                          <div className="font-semibold">Task {pIdx + 1}</div>
                          <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">{p}</div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Input placeholder="Your answer…" />
                            <Button type="button" variant="outline">
                              Self-check
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Tip: Use “Self-check” after you compare with the rules and examples above.
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {isErrors && topic.item.common_errors?.length ? (
                    <div className="space-y-2">
                      {topic.item.common_errors.map((e, eIdx) => (
                        <div
                          key={eIdx}
                          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
                        >
                          {e}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          )
        })}

      {topic.item.tables?.length ? (
        <Card className="p-5">
          <div className="text-sm font-bold text-foreground">Tables</div>
          <div className="mt-4 space-y-3">
            {topic.item.tables.map((t) => (
              <div key={t.title} className="rounded-xl border border-border bg-white/90 p-3 dark:bg-[var(--background)] ">
                <div className="text-xs font-bold text-foreground">{t.title}</div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        {t.headers.map((h) => (
                          <th key={h} className="border-b border-border px-2 py-1 font-semibold text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {t.rows.map((r, rIdx) => (
                        <tr key={rIdx}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className="border-b border-border/60 px-2 py-1 text-foreground whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {topic.item.notes?.length ? (
        <Card className="p-5">
          <div className="text-sm font-bold text-foreground">Notes</div>
          <div className="mt-3 space-y-2">
            {topic.item.notes.map((n, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-white/90 p-3 text-sm text-foreground dark:bg-[var(--background)]">
                {n}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {topic.item.keywords?.length ? (
        <Card className="p-5">
          <div className="text-sm font-bold text-foreground">Keywords</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {topic.item.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-border bg-white/90 px-2 py-1 text-[11px] text-muted-foreground dark:bg-[var(--background)]"
              >
                {k}
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}

type GrammarResponse = {
  grammar: {
    slug: string
    language: string
    content: JsonValue
    updatedAt?: string
  }
}

type GrammarLibraryItem = {
  id: string
  title: string
  level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2'
  explanation: string
  examples: GrammarExample[]
  notes?: string[]
  common_errors?: string[]
  keywords?: string[]
  tables?: Array<{ title: string; headers: string[]; rows: string[][] }>
  practice?: string[]
}

type GrammarLibrarySection = {
  title: string
  items: GrammarLibraryItem[]
}

type GrammarLibraryContent = {
  language?: string
  version?: string
  sections?: {
    a0?: GrammarLibrarySection[]
    a1?: GrammarLibrarySection[]
    a2?: GrammarLibrarySection[]
    b1?: GrammarLibrarySection[]
    b2?: GrammarLibrarySection[]
  }
}

function labelFromKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function isPlainObject(v: unknown): v is JsonObject {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function toSearchText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function asLibraryContent(v: JsonValue): GrammarLibraryContent | null {
  if (!isPlainObject(v)) return null
  const sections = (v as JsonObject)['sections']
  if (!isPlainObject(sections)) return null
  return v as unknown as GrammarLibraryContent
}

function libraryToSearchText(item: GrammarLibraryItem) {
  const parts = [
    item.level,
    item.title,
    item.explanation,
    ...(item.keywords ?? []),
    ...(item.notes ?? []),
    ...(item.common_errors ?? []),
    ...(item.practice ?? []),
    ...item.examples.flatMap((e) => [e.de, e.en, e.audioText ?? '', ...(e.glossary?.flatMap((g) => [g.de, g.en]) ?? [])]),
  ]
  return parts.join(' ').toLowerCase()
}

function KeyValue({ k, v }: { k: string; v: JsonValue }) {
  if (v == null) return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return (
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{labelFromKey(k)}</div>
        <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">{String(v)}</div>
      </div>
    )
  }

  if (Array.isArray(v)) {
    return (
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{labelFromKey(k)}</div>
        <div className="mt-2 space-y-2">
          {v.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-white/90 p-3 text-sm text-foreground dark:bg-[var(--background)]">
              {isPlainObject(item) ? (
                <div className="space-y-2">
                  {Object.keys(item).map((kk) => (
                    <div key={kk}>
                      <span className="text-xs font-semibold text-muted-foreground">{labelFromKey(kk)}:</span>{' '}
                      <span className="text-xs text-foreground">{toSearchText(item[kk])}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-foreground">{toSearchText(item)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isPlainObject(v)) {
    const entries = Object.entries(v)
    return (
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{labelFromKey(k)}</div>
        <div className="mt-2 space-y-3">
          {entries.map(([kk, vv]) => (
            <KeyValue key={kk} k={kk} v={vv} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{labelFromKey(k)}</div>
      <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">{toSearchText(v)}</div>
    </div>
  )
}

export default function GrammarPage() {
  const hasToken = useHasToken()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grammar, setGrammar] = useState<GrammarResponse['grammar'] | null>(null)

  const [query, setQuery] = useState('')

  const [levelFilter, setLevelFilter] = useState<LibraryLevelKey | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TopicType | 'all'>('all')
  const [showTranslations, setShowTranslations] = useState(true)

  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [completed, setCompleted] = useState<Record<string, true>>({})
  const [bookmarks, setBookmarks] = useState<Record<string, true>>({})

  const library = useMemo(() => {
    return asLibraryContent(grammar?.content ?? null)
  }, [grammar])

  useEffect(() => {
    setCompleted(storageGetJson<Record<string, true>>('grammar.completed.v1', {}))
    setBookmarks(storageGetJson<Record<string, true>>('grammar.bookmarks.v1', {}))
    const saved = storageGetJson<{ selectedId?: string; showTranslations?: boolean }>('grammar.ui.v1', {})
    if (saved.selectedId) setSelectedId(saved.selectedId)
    if (typeof saved.showTranslations === 'boolean') setShowTranslations(saved.showTranslations)
  }, [])

  useEffect(() => {
    storageSetJson('grammar.completed.v1', completed)
  }, [completed])

  useEffect(() => {
    storageSetJson('grammar.bookmarks.v1', bookmarks)
  }, [bookmarks])

  useEffect(() => {
    storageSetJson('grammar.ui.v1', { selectedId, showTranslations })
  }, [selectedId, showTranslations])

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await apiFetch<GrammarResponse>('/content/grammar?slug=german')
        setGrammar(res.grammar)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load grammar')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  const flatTopics = useMemo((): FlatTopic[] => {
    if (!library?.sections) return []
    const out: FlatTopic[] = []
    for (const levelKey of ['a0', 'a1', 'a2', 'b1', 'b2'] as const) {
      const sections = library.sections[levelKey]
      if (!Array.isArray(sections) || !sections.length) continue
      for (const sec of sections as unknown as GrammarLibrarySection[]) {
        for (const item of sec.items ?? []) {
          const topicType = guessTopicType(item)
          out.push({
            levelKey,
            levelLabel: levelLabel(levelKey),
            sectionTitle: sec.title,
            item,
            topicType,
            searchText: libraryToSearchText(item),
          })
        }
      }
    }
    return out
  }, [library])

  const visibleTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    return flatTopics.filter((t) => {
      if (levelFilter !== 'all' && t.levelKey !== levelFilter) return false
      if (typeFilter !== 'all' && t.topicType !== typeFilter) return false
      if (!q) return true
      return t.searchText.includes(q) || t.sectionTitle.toLowerCase().includes(q) || t.item.title.toLowerCase().includes(q)
    })
  }, [flatTopics, levelFilter, typeFilter, query])

  const groupedNav = useMemo(() => {
    const out = new Map<LibraryLevelKey, Map<string, FlatTopic[]>>()
    for (const t of visibleTopics) {
      const secMap = out.get(t.levelKey) ?? new Map<string, FlatTopic[]>()
      const arr = secMap.get(t.sectionTitle) ?? []
      arr.push(t)
      secMap.set(t.sectionTitle, arr)
      out.set(t.levelKey, secMap)
    }
    return out
  }, [visibleTopics])

  const selectedTopic = useMemo(() => {
    if (!selectedId) return null
    return flatTopics.find((t) => t.item.id === selectedId) ?? null
  }, [flatTopics, selectedId])

  useEffect(() => {
    if (!flatTopics.length) return
    if (selectedId && flatTopics.some((t) => t.item.id === selectedId)) return
    setSelectedId(flatTopics[0].item.id)
  }, [flatTopics, selectedId])

  const totalCount = flatTopics.length
  const completedCount = useMemo(() => {
    let c = 0
    for (const t of flatTopics) if (completed[t.item.id]) c += 1
    return c
  }, [completed, flatTopics])

  const progressValue = percent(completedCount, totalCount)

  const selectedIndex = useMemo(() => {
    if (!selectedTopic) return -1
    return visibleTopics.findIndex((t) => t.item.id === selectedTopic.item.id)
  }, [selectedTopic, visibleTopics])

  const prevTopic = selectedIndex > 0 ? visibleTopics[selectedIndex - 1] : null
  const nextTopic = selectedIndex >= 0 && selectedIndex < visibleTopics.length - 1 ? visibleTopics[selectedIndex + 1] : null

  const updatedAt = grammar?.updatedAt ? new Date(grammar.updatedAt).toLocaleString() : null

  const pageTitle = selectedTopic?.item.title ? selectedTopic.item.title : 'German Grammar'

  return (
    <AppShell>
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted-foreground">Grammar</div>
              <h1 className="mt-1 text-2xl font-extrabold text-foreground break-words">{pageTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Master German grammar from A0 to B2</p>
              {updatedAt ? <div className="mt-2 text-[11px] text-muted-foreground">Last updated: {updatedAt}</div> : null}
            </div>

            <div className="flex flex-col gap-3 w-full lg:max-w-2xl">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
                  <span className="inline-flex items-center gap-2">
                    <PanelLeft className="h-4 w-4" /> Topics
                  </span>
                </Button>

                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search grammar (e.g. word order, cases, Perfekt)" className="pl-10" />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Level</div>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as LibraryLevelKey | 'all')}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground"
                  >
                    <option value="all">All levels</option>
                    <option value="a0">A0</option>
                    <option value="a1">A1</option>
                    <option value="a2">A2</option>
                    <option value="b1">B1</option>
                    <option value="b2">B2</option>
                  </select>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Topic type</div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TopicType | 'all')}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground"
                  >
                    <option value="all">All types</option>
                    <option value="Verbs">Verbs</option>
                    <option value="Nouns & Articles">Nouns & Articles</option>
                    <option value="Cases">Cases</option>
                    <option value="Tenses">Tenses</option>
                    <option value="Sentence Structure">Sentence Structure</option>
                    <option value="Pronouns">Pronouns</option>
                    <option value="Prepositions">Prepositions</option>
                    <option value="Adjectives">Adjectives</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Progress</div>
                  <div className="mt-2">
                    <ProgressBar value={progressValue} />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {completedCount}/{totalCount} topics completed ({progressValue}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to view the grammar library.</p>
          <Button asChild className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}
      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {hasToken && !loading && !error && !grammar ? (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">No grammar data found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Import the grammar into MongoDB first, then refresh this page.
          </p>
        </Card>
      ) : null}

      {hasToken && !loading && !error && grammar ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="hidden lg:block">
            <Card className="p-4 sticky top-6">
              <div className="text-sm font-bold text-foreground">Navigation</div>
              <div className="mt-1 text-xs text-muted-foreground">Levels → Modules → Topics</div>

              <div className="mt-4 space-y-3">
                {(['a0', 'a1', 'a2', 'b1', 'b2'] as const).map((lvl) => {
                  const secMap = groupedNav.get(lvl)
                  if (!secMap || !secMap.size) return null

                  return (
                    <div key={lvl} className="rounded-xl border border-border p-3 dark:bg-[var(--background)]bg-white/90">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Pill tone="level">{levelLabel(lvl)}</Pill>
                          <div className="text-xs font-semibold text-muted-foreground">{Array.from(secMap.values()).reduce((a, b) => a + b.length, 0)} topics</div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        {Array.from(secMap.entries()).map(([secTitle, topics]) => (
                          <div key={secTitle}>
                            <div className="text-xs font-bold text-foreground">{secTitle}</div>
                            <div className="mt-2 space-y-1">
                              {topics.map((t) => {
                                const active = selectedId === t.item.id
                                const done = Boolean(completed[t.item.id])
                                const saved = Boolean(bookmarks[t.item.id])
                                return (
                                  <button
                                    key={t.item.id}
                                    type="button"
                                    onClick={() => setSelectedId(t.item.id)}
                                    className={
                                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ' +
                                      (active
                                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                                        : 'border-border bg-[var(--background)] text-foreground hover:bg-[var(--accent)] dark:bg-[var(--accent)]')
                                    }
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate">{t.item.title}</div>
                                        <div className="mt-1 text-[11px] text-muted-foreground truncate">{t.topicType}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {saved ? <BookmarkCheck className="h-4 w-4 text-amber-600" /> : null}
                                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {!visibleTopics.length ? (
                  <Card className="p-6">
                    <div className="text-sm font-bold text-foreground">No matches</div>
                    <div className="mt-1 text-xs text-muted-foreground">Try a different search term or reset filters.</div>
                  </Card>
                ) : null}
              </div>
            </Card>
          </div>

          {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-[92%] max-w-sm bg-white p-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">Topics</div>
                  <Button type="button" variant="outline" onClick={() => setMobileNavOpen(false)}>
                    <span className="inline-flex items-center gap-2">
                      <X className="h-4 w-4" /> Close
                    </span>
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {(['a0', 'a1', 'a2', 'b1', 'b2'] as const).map((lvl) => {
                    const secMap = groupedNav.get(lvl)
                    if (!secMap || !secMap.size) return null
                    return (
                      <div key={lvl} className="rounded-xl border border-border bg-white/60 p-3">
                        <div className="flex items-center justify-between">
                          <Pill tone="level">{levelLabel(lvl)}</Pill>
                          <div className="text-xs text-muted-foreground">{Array.from(secMap.values()).reduce((a, b) => a + b.length, 0)}</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {Array.from(secMap.entries()).map(([secTitle, topics]) => (
                            <div key={secTitle}>
                              <div className="text-xs font-bold text-foreground">{secTitle}</div>
                              <div className="mt-2 space-y-1">
                                {topics.map((t) => (
                                  <button
                                    key={t.item.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedId(t.item.id)
                                      setMobileNavOpen(false)
                                    }}
                                    className={
                                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ' +
                                      (selectedId === t.item.id ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-border bg-white/40 text-foreground')
                                    }
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate">{t.item.title}</div>
                                        <div className="mt-1 text-[11px] text-muted-foreground truncate">{t.topicType}</div>
                                      </div>
                                      {completed[t.item.id] ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div>
            {selectedTopic ? (
              <TopicViewer
                topic={selectedTopic}
                showTranslations={showTranslations}
                onToggleTranslations={() => setShowTranslations((v) => !v)}
                isCompleted={Boolean(completed[selectedTopic.item.id])}
                onToggleCompleted={() =>
                  setCompleted((m) => {
                    const next = { ...m }
                    if (next[selectedTopic.item.id]) delete next[selectedTopic.item.id]
                    else next[selectedTopic.item.id] = true
                    return next
                  })
                }
                isBookmarked={Boolean(bookmarks[selectedTopic.item.id])}
                onToggleBookmarked={() =>
                  setBookmarks((m) => {
                    const next = { ...m }
                    if (next[selectedTopic.item.id]) delete next[selectedTopic.item.id]
                    else next[selectedTopic.item.id] = true
                    return next
                  })
                }
                onPrev={() => (prevTopic ? setSelectedId(prevTopic.item.id) : null)}
                onNext={() => (nextTopic ? setSelectedId(nextTopic.item.id) : null)}
                hasPrev={Boolean(prevTopic)}
                hasNext={Boolean(nextTopic)}
              />
            ) : (
              <Card className="p-6">
                <div className="text-sm font-bold text-foreground">Select a topic</div>
                <div className="mt-1 text-xs text-muted-foreground">Use the navigation to start learning.</div>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
