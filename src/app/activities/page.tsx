'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Activity = {
  _id: string;
};

export default function ActivitiesEntryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function go() {
      try {
        setError(null);
        const res = await apiFetch<{ activity: Activity }>('/content/activities/random');
        if (cancelled) return;
        router.replace(`/activities/${res.activity._id}`);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load random activity');
      }
    }

    go();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AppShell>
      <Card className="p-8">
        <div className="text-sm font-bold text-foreground">Practice Activity</div>
        <div className="mt-2 text-sm text-muted-foreground">Loading a new activity…</div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="h-10" onClick={() => router.refresh()}>
            Try again
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
