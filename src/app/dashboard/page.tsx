'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Hero } from '@/components/ui/Hero';
import { Badge } from '@/components/ui/Badge';

type Level = { _id: string; code: string; title: string; description?: string; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };
type Module = { _id: string; title: string; description?: string; order: number; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };
type Lesson = { _id: string; title: string; order: number; status?: 'locked' | 'available' | 'completed'; isCurrent?: boolean };

type LevelsResponse = { levels: Level[] };

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const hasToken = useMemo(() => Boolean(getToken()), []);

  useEffect(() => {
    async function load() {
      if (!hasToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const levelsData = await apiFetch<LevelsResponse>(`/content/levels?courseSlug=german-goethe`);
        setLevels(levelsData.levels);

        // Only load modules and lessons if we have unlocked content
        const firstUnlockedLevel = levelsData.levels.find(l => l.status !== 'locked');
        if (!firstUnlockedLevel) {
          setLoading(false);
          return;
        }

        const modulesData = await apiFetch<{ modules: Module[] }>(`/content/levels/${firstUnlockedLevel._id}/modules`);
        setModules(modulesData.modules);

        const firstUnlockedModule = modulesData.modules.find(m => m.status !== 'locked');
        if (!firstUnlockedModule) {
          setLoading(false);
          return;
        }

        const lessonsData = await apiFetch<{ lessons: Lesson[] }>(`/content/modules/${firstUnlockedModule._id}/lessons`);
        setLessons(lessonsData.lessons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hasToken]);

  return (
    <Container size="lg" className="py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Goethe-aligned levels, short lessons, interactive practice.</p>
        </div>

        <div className="flex gap-3">
          {!hasToken ? (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                clearToken();
                window.location.href = '/login';
              }}
            >
              Logout
            </Button>
          )}
        </div>
      </div>

      {loading ? <div className="mt-10 text-sm text-zinc-600">Loading…</div> : null}
      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      
      {!hasToken && (
        <Card className="mt-10 p-8 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">Login Required</h2>
          <p className="mt-2 text-sm text-zinc-600">Please login to access your German learning dashboard.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
          </Button>
        </Card>
      )}
      
      {hasToken && !loading && !error && levels.length === 0 && (
        <Card className="mt-10 p-8 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">No Content Available</h2>
          <p className="mt-2 text-sm text-zinc-600">Please run the backend seed script to populate the database with German learning content.</p>
        </Card>
      )}

      {hasToken && !loading && !error && levels.length > 0 && (
        <>
          <Hero 
            title="Willkommen im German Learning App"
            subtitle="Master German from A0 to B1"
            description="Interactive lessons, practice games, and comprehensive exercises to help you learn German effectively."
          >
            <Button variant="shiny" className="px-8 py-3">
              Start Learning
            </Button>
            <Button variant="outline" className="px-8 py-3">
              View Progress
            </Button>
          </Hero>
          
          <div className="grid gap-8 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Levels</h2>
          <div className="space-y-4">
            {levels.map((l) => (
              <div 
                key={l._id} 
                className={`rounded-xl p-4 transition-all hover:shadow-md ${
                  l.status === 'locked' ? 'bg-muted/50 opacity-60' : 
                  l.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                  l.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 
                  'bg-card border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{l.code} — {l.title}</div>
                    {l.description && <div className="text-sm text-muted-foreground mt-1">{l.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {l.status === 'locked' && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                    {l.status === 'completed' && <Badge variant="success" className="text-xs">Completed</Badge>}
                    {l.isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                  </div>
                </div>
                {l.status === 'locked' && <div className="text-xs text-muted-foreground mt-3">Complete previous lessons to unlock</div>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Modules</h2>
          <div className="space-y-4">
            {modules.map((m) => (
              <div 
                key={m._id} 
                className={`rounded-xl p-4 transition-all hover:shadow-md ${
                  m.status === 'locked' ? 'bg-muted/50 opacity-60' : 
                  m.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                  m.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 
                  'bg-card border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{m.title}</div>
                    {m.description && <div className="text-sm text-muted-foreground mt-1">{m.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {m.status === 'locked' && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                    {m.status === 'completed' && <Badge variant="success" className="text-xs">Completed</Badge>}
                    {m.isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                  </div>
                </div>
                {m.status === 'locked' && <div className="text-xs text-muted-foreground mt-3">Complete previous lessons to unlock</div>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson) => (
              lesson.status !== 'locked' ? (
                <Link
                  key={lesson._id}
                  href={`/lessons/${lesson._id}`}
                  className={`block rounded-xl p-4 transition-all hover:shadow-md ${
                    lesson.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                    lesson.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 
                    'bg-card border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{lesson.order}. {lesson.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {lesson.status === 'completed' ? 'Review lesson' : 'Start lesson'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.status === 'completed' && <Badge variant="success" className="text-xs">Completed</Badge>}
                      {lesson.isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={lesson._id} className="rounded-xl p-4 bg-muted/50 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{lesson.order}. {lesson.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">Locked</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">Locked</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">Complete previous lessons to unlock</div>
                </div>
              )
            ))}
            {lessons.length === 0 && <div className="text-sm text-muted-foreground">No lessons yet. Run backend seed.</div>}
          </div>
        </Card>

        {/* Games Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Practice Games</h2>
            <Badge variant="shiny" className="text-xs">New</Badge>
          </div>
          <div className="space-y-4">
            <Link
              href="/games/find-article"
              className="block rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">🎮 Find Article</div>
                  <div className="text-sm text-muted-foreground mt-1">Practice German articles (der/die/das) - 15 XP per correct answer</div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">15 XP</Badge>
                  </div>
                </div>
                <div className="text-foreground">
                  <span className="text-lg">→</span>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
        </>
      )}
    </Container>
  );
}
