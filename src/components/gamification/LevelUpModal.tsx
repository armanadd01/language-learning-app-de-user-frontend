'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUp } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export type LevelUpPayload = {
  previousLevel: number
  newLevel: number
  xpGained: number
  rewards: Array<{ label: string; value: string }>
  unlockedFeatures: string[]
}

export function LevelUpModal({
  open,
  payload,
  onClose,
}: {
  open: boolean
  payload: LevelUpPayload | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && payload ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <Card className="p-0 overflow-hidden">
              <div className="h-2 bg-cyan-500" />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30">
                      <ArrowUp className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-foreground">Level Up!</div>
                      <div className="mt-1 text-xs text-muted-foreground">You just reached Level {payload.newLevel}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/60 text-muted-foreground hover:bg-zinc-100 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rewards Earned</div>
                  <div className="mt-3 space-y-2">
                    {payload.rewards.map((r) => (
                      <div key={r.label} className="flex items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-3 text-xs dark:bg-zinc-950/30">
                        <div className="font-semibold text-foreground">{r.label}</div>
                        <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                          {r.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Unlocked Features</div>
                  <div className="mt-3 space-y-2">
                    {(payload.unlockedFeatures?.length ? payload.unlockedFeatures : ['More practice content available']).map((f) => (
                      <div key={f} className="rounded-2xl border border-border bg-white/60 px-3 py-3 text-xs text-muted-foreground dark:bg-zinc-950/30">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={onClose} className="mt-6 h-11 w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                  Wunderbar! Continue Learning →
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
