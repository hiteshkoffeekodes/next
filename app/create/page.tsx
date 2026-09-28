'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Loader2, Play } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function CreateGamePage() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: hostName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Save player session so reconnection works
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `bingo_session_${data.roomCode}`,
          JSON.stringify({ playerId: data.playerId, playerName: hostName.trim() })
        );
      }

      router.push(`/game/${data.roomCode}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating room');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-400/20 dark:bg-indigo-600/15 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-slate-500">
            Create Room
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-2xl flex flex-col gap-6 transition-colors">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-indigo-500/10 border border-violet-200 dark:border-indigo-500/30 flex items-center justify-center text-violet-600 dark:text-indigo-400 mb-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create New Game
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              You will be the host. Set up a room and invite your friends.
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="hostName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Your Player Name
              </label>
              <input
                id="hostName"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Hitesh"
                maxLength={20}
                required
                autoFocus
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-700/80 focus:border-violet-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold outline-none transition-all shadow-inner"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-4xl mx-auto px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-600">
        Host will be able to share room code and start the game for all players.
      </footer>
    </div>
  );
}
