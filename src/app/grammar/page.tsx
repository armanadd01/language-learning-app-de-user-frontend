'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useHasToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = { [key: string]: JsonValue }

function GrammarItemCard({ item }: { item: GrammarLibraryItem }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="p-5">
      <button type="button" className="flex w-full items-center justify-between gap-4" onClick={() => setOpen((o) => !o)}>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground truncate">{item.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">Click to {open ? 'collapse' : 'expand'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.level}</div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open ? (
        <div className="mt-4">
          <div className="text-sm text-foreground whitespace-pre-wrap">{item.explanation}</div>

          {item.tables?.length ? (
            <div className="mt-4 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tables</div>
              {item.tables.map((t) => (
                <div key={t.title} className="rounded-xl border border-border bg-white/60 p-3 dark:bg-zinc-950/30">
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
                        {t.rows.map((r, idx) => (
                          <tr key={idx}>
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
          ) : null}

          {item.examples?.length ? (
            <div className="mt-4 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Examples</div>
              {item.examples.map((ex, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-white/60 p-3 text-sm text-foreground dark:bg-zinc-950/30">
                  <div className="font-semibold">{ex.de}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{ex.en}</div>
                </div>
              ))}
            </div>
          ) : null}

          {item.notes?.length ? (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
              <div className="mt-2 space-y-2">
                {item.notes.map((n, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-white/60 p-3 text-sm text-foreground dark:bg-zinc-950/30">
                    {n}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {item.common_errors?.length ? (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Common errors</div>
              <div className="mt-2 space-y-2">
                {item.common_errors.map((e, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
                  >
                    {e}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {item.keywords?.length ? (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Keywords</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-border bg-white/60 px-2 py-1 text-[11px] text-muted-foreground dark:bg-zinc-950/30"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

function GrammarLevelBlock({ title, sections, defaultOpen }: { title: string; sections: GrammarLibrarySection[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <Card className="p-5">
      <button type="button" className="flex w-full items-center justify-between gap-4" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Level</div>
          <div className="mt-1 text-lg font-extrabold text-foreground">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">Sections: {sections.length}</div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open ? (
        <div className="mt-4 grid gap-4">
          {sections.map((sec) => (
            <GrammarSectionBlock key={sec.title} section={sec} />
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function GrammarSectionBlock({ section }: { section: GrammarLibrarySection }) {
  const [open, setOpen] = useState(true)

  return (
    <Card className="p-5">
      <button type="button" className="flex w-full items-center justify-between gap-4" onClick={() => setOpen((o) => !o)}>
        <div className="text-sm font-bold text-foreground">{section.title}</div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open ? (
        <div className="mt-4 grid gap-4">
          {section.items.map((item) => (
            <GrammarItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </Card>
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
  level: 'A0' | 'A1' | 'A2' | 'B1'
  explanation: string
  examples: Array<{ de: string; en: string }>
  notes?: string[]
  common_errors?: string[]
  keywords?: string[]
  tables?: Array<{ title: string; headers: string[]; rows: string[][] }>
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
  }
}

type Node = {
  path: string
  key: string
  value: JsonValue
  label: string
  depth: number
  text: string
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

function buildNodes(value: JsonValue, basePath: string, depth: number): Node[] {
  if (!isPlainObject(value)) return []
  const nodes: Node[] = []
  for (const k of Object.keys(value)) {
    const v = value[k]
    const path = basePath ? `${basePath}.${k}` : k
    const label = labelFromKey(k)
    nodes.push({
      path,
      key: k,
      value: v,
      label,
      depth,
      text: `${label} ${toSearchText(v)}`.toLowerCase(),
    })
    if (isPlainObject(v)) nodes.push(...buildNodes(v, path, depth + 1))
    if (Array.isArray(v)) {
      for (const item of v) {
        if (isPlainObject(item)) nodes.push(...buildNodes(item, path, depth + 1))
      }
    }
  }
  return nodes
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
    ...item.examples.flatMap((e) => [e.de, e.en]),
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
            <div key={idx} className="rounded-xl border border-border bg-white/60 p-3 text-sm text-foreground dark:bg-zinc-950/30">
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

function GrammarSection({ title, data, defaultOpen }: { title: string; data: JsonValue; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <Card className="p-5">
      <button type="button" className="flex w-full items-center justify-between gap-4" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="text-sm font-bold text-foreground">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">Click to {open ? 'collapse' : 'expand'}</div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open ? (
        <div className="mt-4">
          {isPlainObject(data) ? (
            <div className="space-y-3">
              {Object.keys(data).map((k) => (
                <KeyValue key={k} k={k} v={data[k]} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap">{toSearchText(data)}</div>
          )}
        </div>
      ) : null}
    </Card>
  )
}

export default function GrammarPage() {
  const hasToken = useHasToken()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grammar, setGrammar] = useState<GrammarResponse['grammar'] | null>(null)

  const [query, setQuery] = useState('')

  const library = useMemo(() => {
    return asLibraryContent(grammar?.content ?? null)
  }, [grammar])

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

  const topSections = useMemo(() => {
    if (!library?.sections) {
      const c = grammar?.content
      if (!c || !isPlainObject(c)) return []
      return Object.keys(c)
        .filter((k) => isPlainObject(c[k]))
        .map((k) => ({ key: k, title: labelFromKey(k), data: c[k] }))
    }

    const out: Array<{ key: string; title: string; data: JsonValue }> = []
    for (const levelKey of ['a0', 'a1', 'a2', 'b1'] as const) {
      const sections = library.sections[levelKey]
      if (!Array.isArray(sections) || !sections.length) continue
      out.push({
        key: levelKey,
        title: levelKey.toUpperCase(),
        data: sections as unknown as JsonValue,
      })
    }
    return out
  }, [grammar, library])

  const allNodes = useMemo(() => {
    if (library?.sections) return []
    const c = grammar?.content
    if (!c) return []
    return buildNodes(c, '', 0)
  }, [grammar, library])

  const filteredLibrary = useMemo(() => {
    if (!library?.sections) return null
    const q = query.trim().toLowerCase()

    const levels: Array<{ key: 'a0' | 'a1' | 'a2' | 'b1'; title: string; sections: GrammarLibrarySection[] }> = []
    for (const levelKey of ['a0', 'a1', 'a2', 'b1'] as const) {
      const sections = library.sections[levelKey]
      if (!Array.isArray(sections) || !sections.length) continue
      levels.push({ key: levelKey, title: levelKey.toUpperCase(), sections: sections as unknown as GrammarLibrarySection[] })
    }

    if (!q) return levels

    return levels
      .map((lvl) => {
        const filteredSections = lvl.sections
          .map((sec) => {
            const items = (sec.items ?? []).filter((it) => libraryToSearchText(it).includes(q))
            return { ...sec, items }
          })
          .filter((sec) => sec.items.length > 0)
        return { ...lvl, sections: filteredSections }
      })
      .filter((lvl) => lvl.sections.length > 0)
  }, [library, query])

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topSections

    const hits = new Set<string>()
    for (const n of allNodes) {
      if (n.text.includes(q) || n.path.toLowerCase().includes(q)) {
        const top = n.path.split('.')[0]
        if (top) hits.add(top)
      }
    }

    return topSections.filter((s) => hits.has(s.key))
  }, [query, allNodes, topSections])

  const updatedAt = grammar?.updatedAt ? new Date(grammar.updatedAt).toLocaleString() : null

  return (
    <AppShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Grammar</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">All Grammar Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and search every grammar rule in your library{grammar?.language ? ` (${grammar.language})` : ''}.
          </p>
          {updatedAt ? <div className="mt-2 text-[11px] text-muted-foreground">Last updated: {updatedAt}</div> : null}
        </div>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grammar (e.g. genitive, word order, Konjunktiv)"
            className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground dark:bg-zinc-950/30"
          />
        </div>
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
        <div className="mt-8">
          {filteredLibrary ? (
            <div className="grid gap-4">
              {filteredLibrary.map((lvl, idx) => (
                <GrammarLevelBlock key={lvl.key} title={lvl.title} sections={lvl.sections} defaultOpen={idx === 0 && !query.trim()} />
              ))}

              {!filteredLibrary.length ? (
                <Card className="p-6">
                  <div className="text-sm font-bold text-foreground">No matches</div>
                  <div className="mt-1 text-xs text-muted-foreground">Try a different search term.</div>
                </Card>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSections.map((s, idx) => (
                <GrammarSection key={s.key} title={s.title} data={s.data} defaultOpen={idx === 0 && !query.trim()} />
              ))}

              {!filteredSections.length ? (
                <Card className="p-6">
                  <div className="text-sm font-bold text-foreground">No matches</div>
                  <div className="mt-1 text-xs text-muted-foreground">Try a different search term.</div>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  )
}
