"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  Gamepad2,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Settings,
  Target,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { clearToken, useHasToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { LevelUpModal, type LevelUpPayload } from "@/components/gamification/LevelUpModal";
import { LEVEL_UP_EVENT } from "@/lib/gamificationEvents";
import { ThemeControls } from "@/components/ui/ThemeControls";
import { startFirebaseTokenSync } from "@/lib/firebaseClient";
import { Footer } from "./Footer";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const learningPath: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { label: "Levels", href: "/levels", icon: <Layers className="h-4 w-4" /> },
  {
    label: "Grammar",
    href: "/grammar",
    icon: <BookOpen className="h-4 w-4" />,
  },
];

const practice: NavItem[] = [
  { label: "Game Hub", href: "/games", icon: <Gamepad2 className="h-4 w-4" /> },
  {
    label: "My Activity",
    href: "/activity",
    icon: <Activity className="h-4 w-4" />,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const hasToken = useHasToken();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [stats, setStats] = React.useState<{
    xpTotal: number;
    streakDays: number;
  } | null>(null);
  const [xpToday, setXpToday] = React.useState<number | null>(null);

  const [levelUpOpen, setLevelUpOpen] = React.useState(false);
  const [levelUpPayload, setLevelUpPayload] = React.useState<LevelUpPayload | null>(null);

  React.useEffect(() => {
    startFirebaseTokenSync();
  }, []);

  React.useEffect(() => {
    function onLevelUp(e: Event) {
      const ce = e as CustomEvent<LevelUpPayload>;
      if (!ce.detail) return;
      setLevelUpPayload(ce.detail);
      setLevelUpOpen(true);
    }

    window.addEventListener(LEVEL_UP_EVENT, onLevelUp);
    return () => window.removeEventListener(LEVEL_UP_EVENT, onLevelUp);
  }, []);

  React.useEffect(() => {
    async function load() {
      if (!hasToken) return;
      try {
        const res = await apiFetch<{
          stats: { xpTotal: number; streakDays: number };
          metrics?: { xpToday?: number };
        }>("/me/summary");
        setStats(res.stats);
        setXpToday(res.metrics?.xpToday ?? null);
      } catch {
        setStats(null);
        setXpToday(null);
      }
    }

    load();
  }, [hasToken]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  function MobileNavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
          active
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        )}
        onClick={() => setMobileNavOpen(false)}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[var(--background)] text-[var(--foreground)]">
      <LevelUpModal
        open={levelUpOpen}
        payload={levelUpPayload}
        onClose={() => {
          setLevelUpOpen(false);
          setLevelUpPayload(null);
        }}
      />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-border bg-[var(--card)] px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileNavOpen(false)}
              >
                <div className="h-9 w-9 rounded-xl bg-[var(--primary)]" />
                <div className="text-sm font-semibold">DeutschPath</div>
              </Link>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--accent)]"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6 overflow-auto pb-6">
              <div>
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Learning Path
                </div>
                <nav className="mt-2 space-y-1">
                  {learningPath.map((item) => (
                    <MobileNavLink key={item.href} item={item} />
                  ))}
                </nav>
              </div>

              <div>
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Practice
                </div>
                <nav className="mt-2 space-y-1">
                  {practice.map((item) => (
                    <MobileNavLink key={item.href} item={item} />
                  ))}
                </nav>
              </div>

              <div>
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Goal
                </div>
                <div className="mt-3 rounded-2xl border border-border bg-[var(--card)] p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Target className="h-4 w-4 text-[var(--primary)]" />
                    Daily XP Goal
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-[var(--muted)]">
                    <div
                      className="h-2 rounded-full bg-[var(--primary)]"
                      style={{
                        width: `${Math.min(100, Math.round(((xpToday ?? 0) / 500) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {xpToday ?? 0} / 500 XP earned
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                  onClick={() => {
                    setMobileNavOpen(false);
                    router.push("/settings");
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => {
                    setMobileNavOpen(false);
                    clearToken();
                    router.push("/login");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-[var(--card)] px-4 py-6 lg:block">
          <div className="px-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[var(--primary)]" />
              <div className="text-sm font-semibold">DeutschPath</div>
            </Link>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Learning Path
              </div>
              <nav className="mt-2 space-y-1">
                {learningPath.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Practice
              </div>
              <nav className="mt-2 space-y-1">
                {practice.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Current Goal
              </div>
              <div className="mt-3 rounded-2xl border border-border bg-[var(--card)] p-3">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Target className="h-4 w-4 text-[var(--primary)]" />
                  Daily XP Goal
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[var(--muted)]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)]"
                    style={{
                      width: `${Math.min(100, Math.round(((xpToday ?? 0) / 500) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {xpToday ?? 0} / 500 XP earned
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-[var(--card)] backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--accent)] lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="text-sm font-semibold">Dashboard</div>
                <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
                  <Link
                    href="/dashboard"
                    className={cn(
                      "hover:text-foreground",
                      pathname === "/dashboard" && "text-foreground",
                    )}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/levels"
                    className={cn(
                      "hover:text-foreground",
                      pathname === "/levels" && "text-foreground",
                    )}
                  >
                    Levels
                  </Link>
                  <Link
                    href="/grammar"
                    className={cn(
                      "hover:text-foreground",
                      pathname === "/grammar" && "text-foreground",
                    )}
                  >
                    Grammar
                  </Link>
                  <Link
                    href="/games"
                    className={cn(
                      "hover:text-foreground",
                      pathname?.startsWith("/games") && "text-foreground",
                    )}
                  >
                    Games
                  </Link>
                  <Link
                    href="/activity"
                    className={cn(
                      "hover:text-foreground",
                      pathname === "/activity" && "text-foreground",
                    )}
                  >
                    Activity
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeControls />
                <div className="hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-200 sm:block">
                  🔥 {stats?.streakDays ?? 0}
                </div>
                <div className="hidden rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-foreground)] sm:block">
                  ⭐ {stats?.xpTotal ?? 0} XP
                </div>
                <div className="h-8 w-8 rounded-full bg-[var(--muted)]" />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          {/* <footer className="border-t border-border py-6">
            <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6">
              © {new Date().getFullYear()} DeutschPath. All rights reserved.
            </div>
          </footer> */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
