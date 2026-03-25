'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getToken } from '@/lib/auth'
import { loadSettings, updateSettings, type NotificationSettings } from '@/lib/settingsStore'

export default function NotificationsSettingsPage() {
  const hasToken = useMemo(() => Boolean(getToken()), [])
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>(() => loadSettings().notifications)

  function save() {
    setSaving(true)
    updateSettings('notifications', notifications)
    window.setTimeout(() => setSaving(false), 250)
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">User Settings</div>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you want to be notified.</p>
        </div>
        <Button asChild variant="outline" className="h-10">
          <Link href="/settings">Back</Link>
        </Button>
      </div>

      {!hasToken && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Login required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please login to manage your notification settings.</p>
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
                    item.href === '/settings/notifications'
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
              <div className="text-sm font-bold text-foreground">Notification channels</div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Push notifications</div>
                  <div className="mt-1 text-xs text-muted-foreground">In-app notifications and reminders.</div>
                </div>
                <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications((s) => ({ ...s, push: e.target.checked }))} />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Email notifications</div>
                  <div className="mt-1 text-xs text-muted-foreground">Account activity and learning reminders.</div>
                </div>
                <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications((s) => ({ ...s, email: e.target.checked }))} />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Lesson reminders</div>
                  <div className="mt-1 text-xs text-muted-foreground">Nudges to keep you consistent.</div>
                </div>
                <input type="checkbox" checked={notifications.reminders} onChange={(e) => setNotifications((s) => ({ ...s, reminders: e.target.checked }))} />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-[var(--card)] p-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Streak alerts</div>
                  <div className="mt-1 text-xs text-muted-foreground">Warn you before losing your streak.</div>
                </div>
                <input type="checkbox" checked={notifications.streakAlerts} onChange={(e) => setNotifications((s) => ({ ...s, streakAlerts: e.target.checked }))} />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="h-10" onClick={() => setNotifications(loadSettings().notifications)}>
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
