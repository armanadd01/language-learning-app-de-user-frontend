'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';

import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

type LessonBlock =
  | { type: 'text'; text: string }
  | { type: 'example'; de: string; en?: string }
  | { type: 'tip'; text: string };

type Lesson = { _id: string; title: string; objectives: string[]; contentBlocks: LessonBlock[] };

type Activity = { _id: string; type: string; prompt: string; order: number };

type LessonResponse = { lesson: Lesson; activities: Activity[] };

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.lessonId;
  
  const [data, setData] = useState<LessonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Check if lessonId exists and is valid
      if (!lessonId || lessonId === 'undefined') {
        setError('Invalid lesson ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching lesson with ID:', lessonId); // Debug log
        const res = await apiFetch<LessonResponse>(`/content/lessons/${lessonId}`);
        console.log('Lesson response:', res); // Debug log
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId]);

  if (loading) {
    return <Container size="lg" className="py-10 text-sm text-zinc-600">Loading…</Container>;
  }

  if (error) {
    return <Container size="lg" className="py-10 text-sm text-red-700">{error}</Container>;
  }

  if (!data) return null;

  return (
    <Container size="lg" className="py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{data.lesson.title}</h1>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>

      {data.lesson.objectives?.length ? (
        <Card className="mt-4 p-5">
          <div className="text-sm font-semibold">Objectives</div>
          <ul className="mt-3 list-disc pl-5 text-sm text-zinc-700">
            {data.lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-4">
          {data.lesson.contentBlocks && data.lesson.contentBlocks.length > 0 ? (
            data.lesson.contentBlocks.map((b, idx) => {
              console.log('Content block:', b); // Debug log
              if (b.type === 'text') return <p key={idx} className="text-sm leading-7 text-zinc-800">{b.text}</p>;
              if (b.type === 'tip')
                return (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                    <div className="font-semibold">Tip</div>
                    <div className="mt-1">{b.text}</div>
                  </div>
                );
              return (
                <div key={idx} className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-sm font-semibold">{b.de}</div>
                  {b.en ? <div className="mt-1 text-xs text-zinc-600">{b.en}</div> : null}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-zinc-600">No content available for this lesson.</div>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="text-sm font-semibold">Practice</div>
        <div className="mt-4 flex flex-col gap-3">
          {data.activities && data.activities.length > 0 ? (
            data.activities.map((a) => (
              <Link
                key={a._id}
                href={`/activities/${a._id}`}
                className="rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 transition-colors block"
              >
                <div className="text-sm font-semibold">{a.type}</div>
                <div className="mt-1 text-xs text-zinc-600">{a.prompt}</div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-zinc-600">No activities available for this lesson.</div>
          )}
        </div>
      </Card>
    </Container>
  );
}
