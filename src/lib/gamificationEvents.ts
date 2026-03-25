import type { LevelUpPayload } from '@/components/gamification/LevelUpModal'

export const LEVEL_UP_EVENT = 'gamification:levelUp'

export function dispatchLevelUp(payload: LevelUpPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<LevelUpPayload>(LEVEL_UP_EVENT, { detail: payload }))
}
