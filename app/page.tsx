import Link from 'next/link';
import { Sparkles, Users, Trophy, Zap, ArrowRight, Dice5 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white overflow-hidden transition-colors duration-300">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-violet-400/25 via-pink-400/15 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-teal-400/20 dark:bg-teal-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-teal-400 shadow-lg shadow-violet-500/30 text-white font-black text-xl">
            B
          </div>
          <span className="text-xl font-black tracking-wider bg-gradient-to-r from-violet-700 via-indigo-600 to-teal-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
            BINGO LIVE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-0.5" />
            Real-time Multiplayer
          </span>

          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-4xl mx-auto z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-indigo-500/10 border border-violet-300 dark:border-indigo-500/30 text-violet-700 dark:text-indigo-300 text-xs sm:text-sm font-bold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-indigo-400 animate-pulse" />
          <span>Turn-Based 5×5 Multiplayer Bingo</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-sm mb-4">
          B I N G O
        </h1>

        <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-300 font-medium max-w-xl mb-8 leading-relaxed">
          Create a room and challenge your friends in real-time.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
          <Link
            href="/create"
            className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Create Game</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/join"
            className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-base uppercase tracking-wider border-2 border-slate-300/90 dark:border-slate-700/80 hover:border-violet-500/60 shadow-lg shadow-slate-200/50 dark:shadow-black/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-violet-600 dark:text-indigo-400" />
            <span>Join Game</span>
          </Link>
        </div>

        {/* Game Features Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
          <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md border-2 border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-2 hover:border-violet-400/80 dark:hover:border-indigo-500/40 shadow-lg shadow-indigo-100/40 dark:shadow-none transition-all">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-indigo-500/10 border border-violet-200 dark:border-indigo-500/30 flex items-center justify-center text-violet-600 dark:text-indigo-400">
              <Dice5 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Unique Shuffled Boards</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
              Every player receives their own independently randomized 1–25 5×5 arrangement.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md border-2 border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-2 hover:border-emerald-400/80 dark:hover:border-emerald-500/40 shadow-lg shadow-indigo-100/40 dark:shadow-none transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Turn-by-Turn Calling</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
              Players take turns calling 1 number at a time. It highlights instantly on everyone&apos;s screen.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md border-2 border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-2 hover:border-amber-400/80 dark:hover:border-amber-500/40 shadow-lg shadow-indigo-100/40 dark:shadow-none transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">B-I-N-G-O Line Tracking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
              Rows, columns, and diagonals form 12 lines. First to complete 5 lines wins!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Real-time Multiplayer Bingo • Built with Next.js & Supabase</span>
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <Link href="/create" className="hover:text-violet-600 dark:hover:text-indigo-400 transition-colors">Create Room</Link>
          <Link href="/join" className="hover:text-violet-600 dark:hover:text-indigo-400 transition-colors">Join Room</Link>
        </div>
      </footer>
    </div>
  );
}
