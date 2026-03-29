import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-[var(--card)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">DeutschPath</h3>
            <p className="text-sm text-muted-foreground">
              Master German from A0 to B1 with interactive lessons, practice games, and comprehensive exercises.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/games/find-article" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Practice Games
                </Link>
              </li>
              <li>
                <Link href="/grammar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Grammar
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Developer</h3>
            <div className="text-sm text-muted-foreground">
              <p>
                Developed by <span className="font-semibold text-foreground">Arman Habib Nahid</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href="https://github.com/armanadd01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub: @armanadd01
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              © {currentYear} DeutschPath. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built by <span className="font-semibold text-foreground">Arman Habib Nahid</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
