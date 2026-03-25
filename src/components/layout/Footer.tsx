import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">German Learning App</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Master German from A0 to B1 with interactive lessons, practice games, and comprehensive exercises.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/games/find-article" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Practice Games
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Developer</h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p>Developed by Arman Habib Nahid</p>
              <div className="flex space-x-4 mt-2">
                <a 
                  href="https://github.com/armanhabibnahid" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/armanhabibnahid" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © {currentYear} German Learning App. All rights reserved.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 md:mt-0">
              Built with ❤️ by Arman Habib Nahid
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
