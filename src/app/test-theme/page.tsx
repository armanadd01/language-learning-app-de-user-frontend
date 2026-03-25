'use client'

import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ColorTemplateSwitcher } from '@/components/ui/ColorTemplateSwitcher'

export default function TestThemePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
          Theme Test Page
        </h1>
        
        <div className="space-y-8">
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Current Theme: {theme}</h2>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle Theme
            </button>
          </div>

          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Components</h2>
            <div className="flex gap-4 items-center">
              <ThemeToggle />
              <ColorTemplateSwitcher />
            </div>
          </div>

          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Theme Classes Test</h2>
            <div className="space-y-2">
              <div className="p-3 bg-white dark:bg-gray-700 rounded">Light mode content</div>
              <div className="p-3 bg-gray-800 dark:bg-gray-600 rounded">Dark mode content</div>
              <div className="p-3 bg-blue-500 dark:bg-blue-400 text-white rounded">Primary color</div>
            </div>
          </div>
        </div>
      </div>
    )
}
