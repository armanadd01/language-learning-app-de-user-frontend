'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

type MeResponse = {
  user: {
    id: string
    email: string
    profile?: { displayName?: string; bio?: string; currentLevelCode?: string }
    createdAt?: string
  }
}

type ProfileUpdateResponse = { profile?: { displayName?: string; bio?: string; currentLevelCode?: string } }

export default function SettingsPage() {
  const hasToken = useMemo(() => Boolean(getToken()), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [user, setUser] = useState<MeResponse['user'] | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [currentLevelCode, setCurrentLevelCode] = useState('')

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await apiFetch<MeResponse>('/auth/me')
        setUser(res.user)
        setDisplayName(res.user.profile?.displayName ?? '')
        setBio(res.user.profile?.bio ?? '')
        setCurrentLevelCode(res.user.profile?.currentLevelCode ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasToken])

  async function save() {
    if (!hasToken) return
    try {
      setSaving(true)
      setError(null)
      const res = await apiFetch<ProfileUpdateResponse>('/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: displayName.trim() ? displayName.trim() : undefined,
          bio,
          currentLevelCode: currentLevelCode || undefined,
        }),
      })

      setUser((u) => (u ? { ...u, profile: { ...(u.profile ?? {}), ...(res.profile ?? {}) } } : u))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleString(undefined, { month: 'long', year: 'numeric' }) : null

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">User Settings</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">Public Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage how other learners see you on the leaderboard.</p>
        </div>
        <Button variant="outline" className="h-10">Edit Profile</Button>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to manage your profile settings.</p>
          <Button asChild className="mt-6">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && loading ? <div className="mt-8 text-sm text-muted-foreground">Loading…</div> : null}
      {hasToken && error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-2">User Settings</div>
          <div className="space-y-1">
            {(
              [
                { label: 'Public Profile', href: '/settings' },
                { label: 'Account Settings', href: '/settings/account-settings' },
                { label: 'Notifications', href: '/settings/notifications' },
                { label: 'Privacy & Security', href: '/settings/privacy-security' },
                { label: 'Preferences', href: '/settings/preferences' },
              ] as const
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.href === '/settings'
                    ? 'block w-full rounded-xl bg-[var(--accent)] px-3 py-2 text-left text-sm font-semibold text-[var(--accent-foreground)]'
                    : 'block w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[var(--muted)]" />
              <div>
                <div className="text-sm font-bold text-foreground">{displayName || user?.email || 'Your profile'}</div>
                <div className="mt-1 text-xs text-muted-foreground">{memberSince ? `Member since ${memberSince}` : ' '}</div>
                <div className="mt-2 flex gap-2">
                  {currentLevelCode ? (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-foreground)]">Level {currentLevelCode}</span>
                  ) : (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Set your level</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Display Name</div>
                <Input className="mt-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground">Bio</div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 h-28 w-full rounded-xl border border-border bg-[var(--card)] p-3 text-sm text-foreground outline-none"
                />
                <div className="mt-2 text-[11px] text-muted-foreground">Brief description for your profile. Max 250 characters.</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground">Current Level</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setCurrentLevelCode(l)}
                      className={
                        l === currentLevelCode
                          ? 'h-9 rounded-xl bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)]'
                          : 'h-9 rounded-xl border border-border bg-[var(--card)] px-4 text-xs font-semibold text-muted-foreground'
                      }
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setDisplayName(user?.profile?.displayName ?? '')
                    setBio(user?.profile?.bio ?? '')
                    setCurrentLevelCode(user?.profile?.currentLevelCode ?? '')
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={saving} className="h-10" onClick={save}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
