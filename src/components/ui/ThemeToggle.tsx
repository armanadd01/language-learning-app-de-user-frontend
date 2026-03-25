'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from './Button'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { setTheme, theme, systemTheme } = useTheme()
  const effectiveTheme = theme === 'system' ? systemTheme : theme
  const resolvedTheme = effectiveTheme === 'dark' ? 'dark' : 'light'

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" className="w-9 h-9 p-0 rounded-lg" disabled />
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className="w-9 h-9 p-0 rounded-lg hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
