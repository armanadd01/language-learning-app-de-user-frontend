import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ColorTemplateSwitcher } from '@/components/ui/ColorTemplateSwitcher'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DE</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">German Learning</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ColorTemplateSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
