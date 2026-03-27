'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useHasToken } from '@/lib/auth'
import { loadSettings, updateSettings, type AccountSettings } from '@/lib/settingsStore'

export default function AccountSettingsPage() {
  const hasToken = useHasToken()
  const [saving, setSaving] = useState(false)
  const [account, setAccount] = useState<AccountSettings>(() => loadSettings().account)

  function save() {
    setSaving(true)
    updateSettings('account', account)
    window.setTimeout(() => setSaving(false), 250)
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">User Settings</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">Account Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account communication and preferences.</p>
        </div>
        <Button asChild variant="outline" className="h-10">
          <Link href="/settings">Back</Link>
        </Button>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to manage your account settings.</p>
          <Button asChild className="mt-6">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}

      {hasToken && (
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
                    item.href === '/settings/account-settings'
                      ? 'block w-full rounded-xl bg-[var(--accent)] px-3 py-2 text-left text-sm font-semibold text-[var(--accent-foreground)]'
                      : 'block w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-4">
              <div className="text-sm font-bold text-foreground">Email preferences</div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Product updates</div>
                  <div className="mt-1 text-xs text-muted-foreground">News about features and improvements.</div>
                </div>
                <input
                  type="checkbox"
                  checked={account.emailUpdates}
                  onChange={(e) => setAccount((s) => ({ ...s, emailUpdates: e.target.checked }))}
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Marketing emails</div>
                  <div className="mt-1 text-xs text-muted-foreground">Tips, offers, and recommended content.</div>
                </div>
                <input
                  type="checkbox"
                  checked={account.marketingEmails}
                  onChange={(e) => setAccount((s) => ({ ...s, marketingEmails: e.target.checked }))}
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Weekly digest</div>
                  <div className="mt-1 text-xs text-muted-foreground">A weekly summary of your progress.</div>
                </div>
                <input
                  type="checkbox"
                  checked={account.weeklyDigest}
                  onChange={(e) => setAccount((s) => ({ ...s, weeklyDigest: e.target.checked }))}
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="h-10" onClick={() => setAccount(loadSettings().account)}>
                  Reset
                </Button>
                <Button className="h-10" disabled={saving} onClick={save}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  )
}
