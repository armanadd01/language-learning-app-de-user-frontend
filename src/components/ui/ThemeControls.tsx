'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Moon, Palette, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

type Accent = {
  id: string
  label: string
  swatchClass: string
}

const ACCENTS: Accent[] = [
  { id: 'cyan', label: 'Cyan', swatchClass: 'bg-cyan-500' },
  { id: 'blue', label: 'Blue', swatchClass: 'bg-blue-600' },
  { id: 'purple', label: 'Purple', swatchClass: 'bg-purple-600' },
  { id: 'emerald', label: 'Emerald', swatchClass: 'bg-emerald-600' },
]

const STORAGE_KEY = 'll_de_accent'

function setHtmlAccent(accent: string) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-accent', accent)
}

function getStoredAccent(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeAccent(accent: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, accent)
  } catch {
    // ignore
  }
}

export function ThemeControls() {
  const { theme, setTheme, systemTheme } = useTheme()
  const effectiveTheme = theme === 'system' ? systemTheme : theme
  const resolvedTheme = effectiveTheme === 'dark' ? 'dark' : 'light'

  const [accent, setAccent] = useState<string>(() => {
    const stored = getStoredAccent()
    return stored && ACCENTS.some((a) => a.id === stored) ? stored : 'cyan'
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHtmlAccent(accent)
  }, [accent])

  const currentAccent = useMemo(() => ACCENTS.find((a) => a.id === accent) ?? ACCENTS[0], [accent])

  function toggleTheme() {
    if (resolvedTheme === 'dark') setTheme('light')
    else setTheme('dark')
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-[var(--card)] px-3 text-xs font-semibold text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="hidden sm:inline">{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-[var(--card)] px-3 text-xs font-semibold text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
        aria-label="Change accent color"
      >
        <Palette className="h-4 w-4" />
        <span className={cn('h-2.5 w-2.5 rounded-full', currentAccent.swatchClass)} />
        <span className="hidden sm:inline">{currentAccent.label}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-[var(--card)] p-2 shadow-xl">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Accent color
          </div>
          <div className="space-y-1">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAccent(a.id)
                  storeAccent(a.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  a.id === accent
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-full', a.swatchClass)} />
                  {a.label}
                </span>
                {a.id === accent ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}
