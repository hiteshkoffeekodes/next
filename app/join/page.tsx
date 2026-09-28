'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { normalizeRoomCode } from '@/lib/bingo/gameRules';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function JoinGamePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    const cleanCode = normalizeRoomCode(roomCode);

    if (!cleanName) {
      setError('Please enter your name');
      return;
    }

    if (!cleanCode) {
      setError('Please enter the room code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: cleanName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      // Save player session so reconnection works
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `bingo_session_${cleanCode}`,
          JSON.stringify({ playerId: data.playerId, playerName: cleanName })
        );
      }

      router.push(`/game/${cleanCode}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error joining room');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-teal-400/20 dark:bg-teal-500/10 blur-3xl pointer-events-none -z-10" />

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
            Join Room
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-2xl flex flex-col gap-6 transition-colors">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-1">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Join Existing Game
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Enter the room code shared by your friend and pick a player name.
            </p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="playerName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Your Player Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Rahul"
                maxLength={20}
                required
                autoFocus
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-700/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="roomCode" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB7K92"
                maxLength={8}
                required
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-700/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base font-mono font-bold tracking-widest uppercase outline-none transition-all shadow-inner"
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
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Room...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Join Game</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-4xl mx-auto px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-600">
        You will join the lobby and play on your own independently shuffled board.
      </footer>
    </div>
  );
}
