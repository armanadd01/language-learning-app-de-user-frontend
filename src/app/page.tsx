import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-7xl items-stretch">
        <div className="hidden w-[460px] shrink-0 border-r border-border bg-[var(--card)] p-10 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--primary)]" />
            <div>
              <div className="text-sm font-semibold">DeutschPath</div>
              <div className="text-xs text-muted-foreground">A0 → C2 learning roadmap</div>
            </div>
          </div>

          <div className="mt-10">
            <div className="inline-flex items-center rounded-full border border-border bg-[var(--card)] px-3 py-1 text-xs font-semibold text-muted-foreground">
              Structured CEFR curriculum
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight">
              Learn German faster with modern lessons, games, and streaks.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Short lessons. Interactive practice. XP and progress insights. Everything lives inside a clean dashboard designed for daily consistency.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[{ t: 'Guided path', s: 'Levels, modules, and lessons in order' }, { t: 'Practice games', s: 'Quick drills that earn XP' }, { t: 'Progress tracking', s: 'Activity and performance insights' }].map((x) => (
              <div key={x.t} className="rounded-2xl border border-border bg-[var(--card)] p-4">
                <div className="text-sm font-bold text-foreground">{x.t}</div>
                <div className="mt-1 text-xs text-muted-foreground">{x.s}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} DeutschPath</div>
        </div>

        <main className="flex-1 px-6 py-10 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center justify-between">
              <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={90} height={18} priority />
              <a className="text-xs font-semibold text-muted-foreground hover:text-foreground" href="/login">Sign in</a>
            </div>

            <div className="mt-10 rounded-3xl border border-border bg-[var(--card)] p-8 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Start learning</div>
              <h2 className="mt-2 text-2xl font-extrabold text-foreground">Welcome to DeutschPath</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create an account, pick your level, and continue from your dashboard.</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]"
                  href="/signup"
                >
                  Get started
                </a>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-[var(--card)] px-5 text-sm font-semibold text-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                  href="/dashboard"
                >
                  Open dashboard
                </a>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-[var(--muted)] p-4 text-xs text-muted-foreground">
                Tip: If you already have an account, hit <span className="font-semibold text-foreground">Sign in</span> and your dashboard will load your progress.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
