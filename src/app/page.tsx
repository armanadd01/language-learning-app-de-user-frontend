import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">Learn German (Goethe A1–C2)</h1>
          <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Short lessons. Interactive practice. XP and progress.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row">
          <a
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white"
            href="/signup"
          >
            Get started
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 px-5 text-sm font-medium"
            href="/dashboard"
          >
            Open dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
