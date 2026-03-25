'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = { [key: string]: JsonValue }

type GrammarResponse = {
  grammar: {
    slug: string
    language: string
    content: JsonValue
    updatedAt?: string
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
  const hasToken = useMemo(() => Boolean(getToken()), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grammar, setGrammar] = useState<GrammarResponse['grammar'] | null>(null)

  const [query, setQuery] = useState('')

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
    const c = grammar?.content
    if (!c || !isPlainObject(c)) return []
    return Object.keys(c)
      .filter((k) => isPlainObject(c[k]))
      .map((k) => ({ key: k, title: labelFromKey(k), data: c[k] }))
  }, [grammar])

  const allNodes = useMemo(() => {
    const c = grammar?.content
    if (!c) return []
    return buildNodes(c, '', 0)
  }, [grammar])

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
        <div className="mt-8 grid gap-4">
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
      ) : null}
    </AppShell>
  )
}
