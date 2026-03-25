'use client'

export type AccountSettings = {
  emailUpdates: boolean
  marketingEmails: boolean
  weeklyDigest: boolean
}

export type NotificationSettings = {
  push: boolean
  email: boolean
  reminders: boolean
  streakAlerts: boolean
}

export type PrivacySecuritySettings = {
  profileVisibility: 'public' | 'private'
  showOnLeaderboard: boolean
  twoFactorEnabled: boolean
}

export type PreferencesSettings = {
  language: 'en' | 'de'
  reduceMotion: boolean
  soundEffects: boolean
}

type SettingsState = {
  account: AccountSettings
  notifications: NotificationSettings
  privacy: PrivacySecuritySettings
  preferences: PreferencesSettings
}

const STORAGE_KEY = 'll_de_settings_v1'

const defaultState: SettingsState = {
  account: {
    emailUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
  },
  notifications: {
    push: true,
    email: true,
    reminders: true,
    streakAlerts: true,
  },
  privacy: {
    profileVisibility: 'public',
    showOnLeaderboard: true,
    twoFactorEnabled: false,
  },
  preferences: {
    language: 'en',
    reduceMotion: false,
    soundEffects: true,
  },
}

export function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    return {
      account: { ...defaultState.account, ...(parsed.account ?? {}) },
      notifications: { ...defaultState.notifications, ...(parsed.notifications ?? {}) },
      privacy: { ...defaultState.privacy, ...(parsed.privacy ?? {}) },
      preferences: { ...defaultState.preferences, ...(parsed.preferences ?? {}) },
    }
  } catch {
    return defaultState
  }
}

export function saveSettings(next: SettingsState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function updateSettings<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
  const current = loadSettings()
  const next: SettingsState = { ...current, [key]: value }
  saveSettings(next)
  return next
}
