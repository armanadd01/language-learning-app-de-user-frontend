'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

const colorTemplates = [
  {
    name: 'Blue',
    className: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    darkClassName: 'bg-gradient-to-r from-blue-600 to-indigo-600',
  },
  {
    name: 'Green',
    className: 'bg-gradient-to-r from-green-600 to-emerald-600',
    darkClassName: 'bg-gradient-to-r from-green-600 to-emerald-600',
  },
  {
    name: 'Purple',
    className: 'bg-gradient-to-r from-purple-600 to-pink-600',
    darkClassName: 'bg-gradient-to-r from-purple-600 to-pink-600',
  },
  {
    name: 'Orange',
    className: 'bg-gradient-to-r from-orange-600 to-red-600',
    darkClassName: 'bg-gradient-to-r from-orange-600 to-red-600',
  }
]

export function ColorTemplateSwitcher() {
  const [mounted, setMounted] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState('Blue')
  const { theme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex items-center gap-1">
      <div className="w-6 h-6 rounded-full border-2 bg-gray-300" />
      <div className="w-6 h-6 rounded-full border-2 bg-gray-300" />
      <div className="w-6 h-6 rounded-full border-2 bg-gray-300" />
      <div className="w-6 h-6 rounded-full border-2 bg-gray-300" />
    </div>
  }

  return (
    <div className="flex items-center gap-1">
      {colorTemplates.map((template) => (
        <button
          key={template.name}
          onClick={() => setSelectedTemplate(template.name)}
          className={cn(
            'relative w-6 h-6 rounded-full border-2 transition-all',
            selectedTemplate === template.name 
              ? 'border-gray-900 dark:border-gray-100 scale-110' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400',
            theme === 'dark' ? template.darkClassName : template.className
          )}
        >
          {selectedTemplate === template.name && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
          <span className="sr-only">{template.name} theme</span>
        </button>
      ))}
    </div>
  )
}
